import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

type BookingInstructorCancellationEmailProps = {
  firstName?: string | null;
  agencyName?: string | null;
  locale?: 'fr' | 'en';
  appUrl?: string;
  clientName?: string | null;
  serviceName?: string | null;
  date?: string;
  startTime?: string;
  endTime?: string;
  address?: string | null;
  cancelledByName?: string | null;
  cancelledByRole?: string | null;
  scheduleUrl?: string;
};

function isFr(locale?: string) {
  return (locale || 'fr').startsWith('fr');
}

function absoluteUrl(appUrl: string, path: string) {
  const base = (appUrl || '').replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function formatDate(date?: string, locale: 'fr' | 'en' = 'fr') {
  if (!date) return '';

  try {
    const value = new Date(`${date}T00:00:00`);
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(value);
  } catch {
    return date;
  }
}

export default function BookingInstructorCancellationEmail({
  firstName,
  agencyName,
  locale = 'en',
  appUrl = 'https://magichango.com',
  clientName,
  serviceName,
  date,
  startTime,
  endTime,
  address,
  cancelledByName,
  cancelledByRole,
  scheduleUrl = 'https://magichango.com/fr/myweek',
}: BookingInstructorCancellationEmailProps) {
  const fr = false;
  const appName = 'MagicHango';
  const name = (firstName || '').trim();
  const logoUrl = absoluteUrl(appUrl, '/NouveauLogoRogne.png');
  const iconUrl = absoluteUrl(appUrl, '/Icone.png');
  const linkedinUrl = 'https://www.linkedin.com/company/magichango';

  const formattedDate = formatDate(date, fr ? 'fr' : 'en');
  const greeting = name
    ? fr
      ? `Bonjour ${name}`
      : `Hi ${name}`
    : fr
      ? 'Bonjour'
      : 'Hi';
  const title = fr ? 'Creneau annule' : 'Slot cancelled';
  const previewText = fr
    ? `Un creneau${clientName ? ` avec ${clientName}` : ''} a ete annule.`
    : `A slot${clientName ? ` with ${clientName}` : ''} has been cancelled.`;

  const intro =
    clientName?.trim() && serviceName?.trim()
      ? fr
        ? `Le rendez-vous "${serviceName}" prevu avec ${clientName} a ete retire de votre agenda.`
        : `The "${serviceName}" appointment scheduled with ${clientName} has been removed from your schedule.`
      : clientName?.trim()
        ? fr
          ? `Le rendez-vous prevu avec ${clientName} a ete retire de votre agenda.`
          : `The appointment scheduled with ${clientName} has been removed from your schedule.`
        : serviceName?.trim()
          ? fr
            ? `Le rendez-vous "${serviceName}" a ete retire de votre agenda.`
            : `The "${serviceName}" appointment has been removed from your schedule.`
          : fr
            ? 'Un rendez-vous a ete annule dans votre agenda.'
            : 'An appointment was cancelled in your schedule.';

  const detailsTitle = fr
    ? 'Details du rendez-vous annule'
    : 'Cancelled slot details';
  const actor =
    cancelledByName?.trim() ||
    (cancelledByRole === 'student'
      ? clientName?.trim()
      : cancelledByRole === 'instructor'
        ? name || null
        : null);

  const actorLabel = fr ? 'Annule par' : 'Cancelled by';
  const clientLabel = fr ? 'Client' : 'Client';
  const serviceLabel = fr ? 'Service' : 'Service';
  const dateLabel = fr ? 'Date' : 'Date';
  const timeLabel = fr ? 'Horaire' : 'Time';
  const addressLabel = fr ? 'Adresse' : 'Address';
  const timeValue =
    startTime && endTime
      ? `${startTime} - ${endTime}`
      : startTime || endTime || '';

  const noteText = fr
    ? 'Votre agenda a ete mis a jour. Vous pouvez consulter votre semaine pour reorganiser votre journee.'
    : 'Your schedule has been updated. You can review your week to reorganize your day.';

  const ctaLabel = fr ? 'Voir mon agenda' : 'View my schedule';
  const linkedinTitle = fr ? 'Restons en contact' : 'Stay connected';
  const linkedinText = fr
    ? `Suivez ${appName} pour voir nos nouveautes et conseils.`
    : `Follow ${appName} for product updates and tips.`;
  const linkedinLabel = fr ? 'Nous suivre' : 'Follow us';
  const footerText = fr
    ? `Vous recevez cet email car une annulation de reservation a ete effectuee sur ${appName}.`
    : `You are receiving this email because a booking cancellation was made on ${appName}.`;

  return (
    <Html>
      <Head>
        <style>
          {`
            @media only screen and (max-width: 520px) {
              .hero-stack,
              .hero-stack td {
                display: block !important;
                width: 100% !important;
              }

              .hero-image-cell {
                padding-bottom: 16px !important;
                text-align: center !important;
              }

              .hero-spacer {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
              }

              .hero-panel-cell {
                box-sizing: border-box !important;
              }

              .hero-image {
                margin: 0 auto !important;
                max-width: 180px !important;
                width: 100% !important;
              }

              .hero-title {
                font-size: 24px !important;
                line-height: 1.15 !important;
              }
            }
          `}
        </style>
      </Head>
      <Preview>{previewText}</Preview>

      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.topBar}>
            <table
              width="100%"
              cellPadding="0"
              cellSpacing="0"
              border={0}
              role="presentation"
              style={styles.table}
            >
              <tbody>
                <tr>
                  <td style={styles.topBarLeft}>
                    <table
                      cellPadding="0"
                      cellSpacing="0"
                      border={0}
                      role="presentation"
                    >
                      <tbody>
                        <tr>
                          <td style={styles.logoCell}>
                            <Img
                              src={logoUrl}
                              width="26"
                              height="26"
                              alt={appName}
                              style={styles.logo}
                            />
                          </td>
                          <td>
                            <Text style={styles.brand}>{appName}</Text>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={styles.topBarRight}>
                    <Text style={styles.topRightText}>
                      {fr ? 'Mise a jour agenda' : 'Schedule update'}
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={styles.heroSection}>
            <table
              width="100%"
              cellPadding="0"
              cellSpacing="0"
              border={0}
              role="presentation"
              style={styles.table}
              className="hero-stack"
            >
              <tbody>
                <tr>
                  <td style={styles.heroImageCell} className="hero-image-cell">
                    <Img
                      src={iconUrl}
                      width="220"
                      alt={fr ? 'Illustration' : 'Illustration'}
                      style={styles.heroImage}
                      className="hero-image"
                    />
                  </td>
                  <td style={styles.heroSpacer} className="hero-spacer" />
                  <td style={styles.heroPanel} className="hero-panel-cell">
                    <Text style={styles.greeting}>{greeting}</Text>
                    <Heading style={styles.title} className="hero-title">
                      {title}
                    </Heading>
                    <Text style={styles.intro}>{intro}</Text>

                    <Section style={styles.detailsCard}>
                      <Text style={styles.detailsTitle}>{detailsTitle}</Text>

                      {clientName ? (
                        <Text style={styles.detailLine}>
                          <strong>{clientLabel} :</strong> {clientName}
                        </Text>
                      ) : null}

                      {serviceName ? (
                        <Text style={styles.detailLine}>
                          <strong>{serviceLabel} :</strong> {serviceName}
                        </Text>
                      ) : null}

                      {formattedDate ? (
                        <Text style={styles.detailLine}>
                          <strong>{dateLabel} :</strong> {formattedDate}
                        </Text>
                      ) : null}

                      {timeValue ? (
                        <Text style={styles.detailLine}>
                          <strong>{timeLabel} :</strong> {timeValue}
                        </Text>
                      ) : null}

                      {address ? (
                        <Text style={styles.detailLine}>
                          <strong>{addressLabel} :</strong> {address}
                        </Text>
                      ) : null}

                      {actor ? (
                        <Text style={styles.detailLine}>
                          <strong>{actorLabel} :</strong> {actor}
                        </Text>
                      ) : null}
                    </Section>

                    <Text style={styles.noteText}>{noteText}</Text>

                    <Section style={styles.ctaWrap}>
                      <Button href={scheduleUrl} style={styles.primaryButton}>
                        {ctaLabel}
                      </Button>
                    </Section>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={styles.linkedinSection}>
            <Text style={styles.linkedinTitle}>{linkedinTitle}</Text>
            <Text style={styles.linkedinText}>{linkedinText}</Text>
            <Section style={styles.linkedinCtaWrap}>
              <Link href={linkedinUrl} style={styles.linkedinButton}>
                {linkedinLabel}
              </Link>
            </Section>
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>{footerText}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    padding: 0,
    width: '100%',
    backgroundColor: '#8920d1',
    fontFamily: 'Tahoma, Geneva, Verdana, Arial, sans-serif',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#8920d1',
    padding: '12px 0 24px',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
  },
  topBar: {
    padding: '10px 20px 18px',
  },
  topBarLeft: {
    verticalAlign: 'middle',
  },
  topBarRight: {
    verticalAlign: 'middle',
    textAlign: 'right',
  },
  logoCell: {
    width: '34px',
    verticalAlign: 'middle',
    paddingRight: '8px',
  },
  logo: {
    display: 'block',
    backgroundColor: 'transparent',
    border: '0',
  },
  brand: {
    margin: 0,
    color: '#f9ffc6',
    fontSize: '13px',
    lineHeight: '14px',
    fontWeight: 700,
  },
  topRightText: {
    margin: 0,
    color: '#f9ffc6',
    fontSize: '13px',
    lineHeight: '14px',
  },
  heroSection: {
    padding: '0 20px',
  },
  heroImageCell: {
    width: '44%',
    verticalAlign: 'middle',
    textAlign: 'center',
  },
  heroSpacer: {
    width: '16px',
    fontSize: '0',
    lineHeight: '0',
  },
  heroPanel: {
    width: '56%',
    verticalAlign: 'middle',
    backgroundColor: '#d400ff',
    borderRadius: '28px',
    padding: '22px 20px',
  },
  heroImage: {
    display: 'block',
    width: '100%',
    maxWidth: '220px',
    height: 'auto',
    backgroundColor: 'transparent',
    margin: '0 auto',
  },
  greeting: {
    margin: '0 0 8px',
    color: '#f9ffc6',
    fontSize: '14px',
    lineHeight: '18px',
  },
  title: {
    margin: '0 0 10px',
    color: '#fff6ec',
    fontSize: '28px',
    lineHeight: '1.1',
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },
  intro: {
    margin: '0 0 16px',
    color: '#fff6ec',
    fontSize: '14px',
    lineHeight: '22px',
  },
  detailsCard: {
    backgroundColor: '#8920d1',
    borderRadius: '20px',
    padding: '14px 16px',
  },
  detailsTitle: {
    margin: '0 0 8px',
    color: '#f9ffc6',
    fontSize: '13px',
    lineHeight: '18px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  detailLine: {
    margin: '0 0 6px',
    color: '#fff6ec',
    fontSize: '13px',
    lineHeight: '20px',
  },
  noteText: {
    margin: '14px 0 0',
    color: '#fff6ec',
    fontSize: '13px',
    lineHeight: '20px',
  },
  ctaWrap: {
    paddingTop: '18px',
    textAlign: 'center',
  },
  primaryButton: {
    display: 'inline-block',
    backgroundColor: '#8920d1',
    color: '#f9ffc6',
    borderRadius: '999px',
    padding: '14px 24px',
    textDecoration: 'none',
    fontSize: '13px',
    lineHeight: '16px',
    fontWeight: 800,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  linkedinSection: {
    padding: '22px 20px 0',
    textAlign: 'center',
  },
  linkedinTitle: {
    margin: '0 0 6px',
    color: '#fff6ec',
    fontSize: '24px',
    lineHeight: '1.15',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    textAlign: 'center',
  },
  linkedinText: {
    margin: '0',
    color: '#f9ffc6',
    fontSize: '13px',
    lineHeight: '20px',
    textAlign: 'center',
  },
  linkedinCtaWrap: {
    paddingTop: '14px',
    textAlign: 'center',
  },
  linkedinButton: {
    display: 'inline-block',
    color: '#f9ffc6',
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: 800,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    border: '2px solid #d400ff',
    borderRadius: '999px',
    padding: '12px 20px',
  },
  footer: {
    padding: '20px 20px 0',
  },
  footerText: {
    margin: 0,
    color: '#f9ffc6',
    fontSize: '11px',
    lineHeight: '16px',
    textAlign: 'center',
  },
};
