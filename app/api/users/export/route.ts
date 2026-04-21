import { type NextRequest, NextResponse } from 'next/server';

import { requireOrgUser } from '@/lib/api/auth-server';
import { getScopedUserRole } from '@/lib/server/repositories/org-user-management-repository';
import {
  listAgencyStudentsExportWithEmails,
  resolveAgencyIdForOrg,
} from '@/lib/server/services/org-user-management-service';

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

function buildAddress(row: {
  formattedAddress?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
}) {
  if (row.formattedAddress?.trim()) {
    return row.formattedAddress.trim();
  }

  return [
    [row.streetNumber, row.street].filter(Boolean).join(' ').trim(),
    [row.postalCode, row.city].filter(Boolean).join(' ').trim(),
    row.country,
  ]
    .filter(Boolean)
    .join(', ');
}

function getLocalizedConfig(locale: ExportLocale) {
  if (locale === 'en') {
    return {
      filename: 'clients-export.xls',
      worksheetName: 'Clients',
      headers: [
        'Client name',
        'Email',
        'Full address',
        'Street',
        'Street number',
        'Postal code',
        'City',
        'Country',
        'Created at',
        'Updated at',
      ],
    };
  }

  return {
    filename: 'export-clients.xls',
    worksheetName: 'Clients',
    headers: [
      'Nom du client',
      'Email',
      'Adresse complète',
      'Rue',
      'Numéro',
      'Code postal',
      'Ville',
      'Pays',
      'Créé le',
      'Mis à jour le',
    ],
  };
}

function buildWorkbookXml(params: {
  worksheetName: string;
  headers: string[];
  rows: string[][];
}) {
  const headerRow = params.headers
    .map(
      (header) =>
        `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`,
    )
    .join('');

  const rowsXml = params.rows
    .map((row) => {
      const cells = row
        .map(
          (value) =>
            `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`,
        )
        .join('');

      return `<Row>${cells}</Row>`;
    })
    .join('');

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
 </Styles>
 <Worksheet ss:Name="${escapeXml(params.worksheetName)}">
  <Table>
   <Row>${headerRow}</Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;
}

export async function GET(request: NextRequest) {
  try {
    const { auth, response } = requireOrgUser(request, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;

    const actorRole = await getScopedUserRole(auth.orgId, auth.userId);
    if (actorRole !== 'instructor' && actorRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const agencyId = await resolveAgencyIdForOrg(auth.orgId);
    if (!agencyId) {
      return NextResponse.json(
        { error: `Agency not found for clerk_org_id=${auth.orgId}` },
        { status: 404 },
      );
    }

    const locale = resolveLocale(request);
    const config = getLocalizedConfig(locale);
    const rows = await listAgencyStudentsExportWithEmails({ agencyId });

    const workbook = buildWorkbookXml({
      worksheetName: config.worksheetName,
      headers: config.headers,
      rows: rows.map((row) => [
        row.name ?? '',
        row.email ?? '',
        buildAddress(row),
        row.street ?? '',
        row.streetNumber ?? '',
        row.postalCode ?? '',
        row.city ?? '',
        row.country ?? '',
        row.createdAt ?? '',
        row.updatedAt ?? '',
      ]),
    });

    return new NextResponse(workbook, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="${config.filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[api/users/export] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 },
    );
  }
}
