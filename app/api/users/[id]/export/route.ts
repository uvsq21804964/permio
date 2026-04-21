import { clerkClient } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';

import { requireOrgUser } from '@/lib/api/auth-server';
import { getAgencyIdFromClerkOrgId } from '@/lib/server/repositories/agency-repository';
import { getScopedUserRole } from '@/lib/server/repositories/org-user-management-repository';
import { listClientBookingExportRows } from '@/lib/server/repositories/slot-repository';
import { getUserById } from '@/lib/server/repositories/user-repository';

export const dynamic = 'force-dynamic';

type ExportLocale = 'fr' | 'en';

function resolveLocale(request: NextRequest): ExportLocale {
  const value = (request.nextUrl.searchParams.get('locale') || 'en').toLowerCase();
  return value.startsWith('en') ? 'en' : 'fr';
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toAmount(value: string | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function formatCurrency(locale: ExportLocale, amount: number) {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function buildAddress(row: {
  formatted_address?: string | null;
  street?: string | null;
  street_number?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
}) {
  if (row.formatted_address?.trim()) {
    return row.formatted_address.trim();
  }

  return [
    [row.street_number, row.street].filter(Boolean).join(' ').trim(),
    [row.postal_code, row.city].filter(Boolean).join(' ').trim(),
    row.country,
  ]
    .filter(Boolean)
    .join(', ');
}

function sanitizeFilenamePart(value: string | null | undefined) {
  const normalized = (value ?? '').trim().toLowerCase();
  if (!normalized) return 'client';

  return (
    normalized
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'client'
  );
}

function buildWorksheetXml(params: {
  name: string;
  headers?: string[];
  rows: string[][];
}) {
  const headerRow = params.headers?.length
    ? `<Row>${params.headers
        .map(
          (header) =>
            `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`,
        )
        .join('')}</Row>`
    : '';

  const rowsXml = params.rows
    .map((row) => {
      const cells = row
        .map(
          (value, index) =>
            `<Cell${
              index === 0 && !params.headers?.length ? ' ss:StyleID="label"' : ''
            }><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`,
        )
        .join('');

      return `<Row>${cells}</Row>`;
    })
    .join('');

  return `<Worksheet ss:Name="${escapeXml(params.name)}"><Table>${headerRow}${rowsXml}</Table></Worksheet>`;
}

function buildWorkbookXml(
  worksheets: Array<{ name: string; headers?: string[]; rows: string[][] }>
) {
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="label">
   <Font ss:Bold="1"/>
  </Style>
 </Styles>
 ${worksheets.map((sheet) => buildWorksheetXml(sheet)).join('')}
</Workbook>`;
}

function getLocalizedConfig(locale: ExportLocale) {
  if (locale === 'en') {
    return {
      summarySheet: 'Summary',
      bookingsSheet: 'Bookings',
      noValue: '-',
      summaryRows: {
        clientName: 'Client name',
        email: 'Email',
        address: 'Address',
        totalBookings: 'Booked lessons',
        totalRevenue: 'Total revenue',
        exportedAt: 'Exported at',
      },
      bookingHeaders: [
        'Date',
        'Start',
        'End',
        'Duration (min)',
        'Service',
        'Dog trainer',
        'Revenue',
        'Address',
        'City',
        'Country',
      ],
      filenamePrefix: 'client-details',
    };
  }

  return {
    summarySheet: 'Synthèse',
    bookingsSheet: 'Cours',
    noValue: '-',
    summaryRows: {
      clientName: 'Nom du client',
      email: 'Email',
      address: 'Adresse',
      totalBookings: 'Cours réservés',
      totalRevenue: "Chiffre d'affaires",
      exportedAt: 'Exporté le',
    },
    bookingHeaders: [
      'Date',
      'Début',
      'Fin',
      'Durée (min)',
      'Service',
      'Éducateur canin',
      "Chiffre d'affaires",
      'Adresse',
      'Ville',
      'Pays',
    ],
    filenamePrefix: 'client-details',
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { auth, response } = requireOrgUser(request, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;

    const actorRole = await getScopedUserRole(auth.orgId, auth.userId);
    if (actorRole !== 'instructor' && actorRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const agencyId = await getAgencyIdFromClerkOrgId(auth.orgId);
    if (!agencyId) {
      return NextResponse.json(
        { error: `Agency not found for clerk_org_id=${auth.orgId}` },
        { status: 404 },
      );
    }

    const { id: targetId } = await context.params;
    if (!targetId) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    const client = await getUserById(targetId);
    if (!client) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (client.agencyId !== agencyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (client.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can be exported' },
        { status: 400 },
      );
    }

    const locale = resolveLocale(request);
    const config = getLocalizedConfig(locale);
    const bookingRows = await listClientBookingExportRows({
      agencyId,
      clientUserId: targetId,
    });

    let email = config.noValue;
    try {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(targetId);
      email =
        user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)
          ?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        config.noValue;
    } catch {
      email = config.noValue;
    }

    const totalRevenue = bookingRows.reduce(
      (sum, row) => sum + toAmount(row.servicePrice),
      0,
    );

    const workbook = buildWorkbookXml([
      {
        name: config.summarySheet,
        rows: [
          [config.summaryRows.clientName, client.name?.trim() || config.noValue],
          [config.summaryRows.email, email],
          [config.summaryRows.address, buildAddress(client) || config.noValue],
          [config.summaryRows.totalBookings, String(bookingRows.length)],
          [config.summaryRows.totalRevenue, formatCurrency(locale, totalRevenue)],
          [
            config.summaryRows.exportedAt,
            new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'Europe/Paris',
            }).format(new Date()),
          ],
        ],
      },
      {
        name: config.bookingsSheet,
        headers: config.bookingHeaders,
        rows: bookingRows.map((row) => [
          row.date,
          row.startTime,
          row.endTime,
          String(row.durationMinutes),
          row.serviceName ?? config.noValue,
          row.instructorName ?? config.noValue,
          formatCurrency(locale, toAmount(row.servicePrice)),
          row.formattedAddress ?? config.noValue,
          row.city ?? config.noValue,
          row.country ?? config.noValue,
        ]),
      },
    ]);

    const filename = `${config.filenamePrefix}-${sanitizeFilenamePart(client.name)}.xls`;

    return new NextResponse(workbook, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[api/users/[id]/export] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to export user details' },
      { status: 500 },
    );
  }
}
