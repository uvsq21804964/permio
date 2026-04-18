// src/emails/welcomeClient.tsx
import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Link,
  Button,
  Img,
} from '@react-email/components';

type WelcomeClientEmailProps = {
  firstName?: string | null;
  agencyName?: string;
  locale?: 'fr' | 'en';
  actionUrl?: string;
  manageUrl?: string;
  instructorName?: string | null;
  appUrl?: string;
};

function isFr(locale?: string) {
  return (locale || 'fr').startsWith('fr');
}

function absoluteUrl(appUrl: string, path: string) {
  const base = (appUrl || '').replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export default function WelcomeClientEmail({
  firstName,
  agencyName,
  locale = 'fr',
  actionUrl = 'https://example.com',
  manageUrl,
  instructorName,
  // appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://magichango.com',
  appUrl = 'https://magichango.com',
}: WelcomeClientEmailProps) {
  const fr = isFr(locale);
  const name = (firstName || '').trim();
  const appName = 'MagicHango';

  const logoUrl = absoluteUrl(appUrl, '/NouveauLogoRogne.png');
  const iconUrl = absoluteUrl(appUrl, '/Icone.png');

  const linkedinUrl = 'https://www.linkedin.com/company/magichango';

  const previewText = fr
    ? `Bienvenue chez ${agencyName} — votre éducateur est sélectionné.`
    : `Welcome at ${agencyName} — your trainer is selected.`;

  const greeting = name
    ? fr
      ? `Bonjour ${name}`
      : `Hi ${name}`
    : fr
      ? 'Bienvenue'
      : 'Welcome';

  const title = fr ? 'Votre éducateur est prêt' : 'Your trainer is ready';

  const intro = instructorName?.trim()
    ? fr
      ? `Vous avez choisi ${instructorName}. Il ne vous reste plus qu’à réserver votre première séance.`
      : `You selected ${instructorName}. All that’s left is to book your first session.`
    : fr
      ? `Votre éducateur est sélectionné. Il ne vous reste plus qu’à réserver votre première séance.`
      : `Your trainer is selected. All that’s left is to book your first session.`;

  const ctaLabel = fr ? 'Réserver ma séance' : 'Book my session';
  const manageLabel = fr ? 'Mes réservations' : 'My bookings';

  const linkedinTitle = fr
    ? 'Rejoignez-nous sur LinkedIn'
    : 'Join us on LinkedIn';

  const linkedinText = fr
    ? `Suivez ${appName} pour découvrir nos actualités.`
    : `Follow ${appName} to discover our latest updates.`;

  const linkedinLabel = fr ? 'Nous suivre' : 'Follow us';

  const footerText = fr
    ? `Vous recevez cet email car vous avez créé un compte sur ${appName}.`
    : `You’re receiving this email because you created an account on ${appName}.`;

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
                      {fr ? 'Espace client' : 'Client space'}
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

                    <Section style={styles.ctaWrap}>
                      <Button href={actionUrl} style={styles.primaryButton}>
                        {ctaLabel}
                      </Button>
                    </Section>

                    {manageUrl ? (
                      <Section style={styles.secondaryWrap}>
                        <Link href={manageUrl} style={styles.secondaryLink}>
                          {manageLabel}
                        </Link>
                      </Section>
                    ) : null}
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
    margin: '0',
    color: '#fff6ec',
    fontSize: '14px',
    lineHeight: '22px',
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

  secondaryWrap: {
    paddingTop: '12px',
    textAlign: 'center',
  },

  secondaryLink: {
    color: '#f9ffc6',
    fontSize: '13px',
    lineHeight: '18px',
    textDecoration: 'none',
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
