import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

type BookingClientReminderEmailProps = {
  agendaUrl?: string;
  agencyName?: string | null;
  firstName?: string | null;
  instructorName?: string | null;
  locale?: 'fr' | 'en';
  meetingAddress?: string | null;
  serviceName?: string | null;
  date?: string;
  startTime?: string;
  endTime?: string;
  instructorEmail?: string | null;
  instructorPhone?: string | null;
  instructorPhoneHref?: string | null;
};

function isFr(locale?: string) {
  return (locale || 'fr').startsWith('fr');
}

function formatDate(date?: string, locale: 'fr' | 'en' = 'fr') {
  if (!date) return '';

  try {
    const parsed = new Date(`${date}T00:00:00`);
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(parsed);
  } catch {
    return date;
  }
}

export default function BookingClientReminderEmail({
  agendaUrl = 'https://magichango.com',
  agencyName = 'MagicHango',
  firstName,
  instructorName,
  locale = 'en',
  meetingAddress,
  serviceName,
  date,
  startTime,
  endTime,
  instructorEmail,
  instructorPhone,
  instructorPhoneHref,
}: BookingClientReminderEmailProps) {
  const fr = false;
  const formattedDate = formatDate(date, fr ? 'fr' : 'en');
  const greeting = firstName?.trim()
    ? fr
      ? `Bonjour ${firstName.trim()}`
      : `Hi ${firstName.trim()}`
    : fr
      ? 'Bonjour'
      : 'Hi';

  const timeValue =
    startTime && endTime
      ? `${startTime} - ${endTime}`
      : startTime || endTime || '';

  const preview = fr
    ? `Rappel : votre séance approche chez ${agencyName}.`
    : `Reminder: your upcoming session with ${agencyName}.`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.card}>
            <Text style={styles.eyebrow}>
              {fr ? 'Rappel de séance' : 'Session reminder'}
            </Text>
            <Heading style={styles.title}>
              {fr ? 'Votre séance approche' : 'Your session is coming up'}
            </Heading>
            <Text style={styles.paragraph}>{greeting}</Text>
            <Text style={styles.paragraph}>
              {fr
                ? 'Voici un rappel avec les informations utiles pour votre prochain rendez-vous.'
                : 'Here is a quick reminder with the key details for your upcoming appointment.'}
            </Text>

            <Section style={styles.details}>
              {serviceName ? (
                <Text style={styles.detailLine}>
                  <strong>{fr ? 'Service :' : 'Service:'}</strong> {serviceName}
                </Text>
              ) : null}
              {instructorName ? (
                <Text style={styles.detailLine}>
                  <strong>{fr ? 'Éducateur :' : 'Trainer:'}</strong>{' '}
                  {instructorName}
                </Text>
              ) : null}
              {instructorEmail ? (
                <Text style={styles.detailLine}>
                  <strong>{fr ? 'Email éducateur :' : 'Trainer email:'}</strong>{' '}
                  <Link
                    href={`mailto:${instructorEmail}`}
                    style={styles.inlineLink}
                  >
                    {instructorEmail}
                  </Link>
                </Text>
              ) : null}
              {instructorPhone ? (
                <Text style={styles.detailLine}>
                  <strong>
                    {fr ? 'Téléphone éducateur :' : 'Trainer phone:'}
                  </strong>{' '}
                  {instructorPhoneHref ? (
                    <Link
                      href={`tel:${instructorPhoneHref}`}
                      style={styles.inlineLink}
                    >
                      {instructorPhone}
                    </Link>
                  ) : (
                    instructorPhone
                  )}
                </Text>
              ) : null}
              {formattedDate ? (
                <Text style={styles.detailLine}>
                  <strong>{fr ? 'Date :' : 'Date:'}</strong> {formattedDate}
                </Text>
              ) : null}
              {timeValue ? (
                <Text style={styles.detailLine}>
                  <strong>{fr ? 'Horaire :' : 'Time:'}</strong> {timeValue}
                </Text>
              ) : null}
              {meetingAddress ? (
                <Text style={styles.detailLine}>
                  <strong>{fr ? 'Lieu :' : 'Location:'}</strong>{' '}
                  {meetingAddress}
                </Text>
              ) : null}
            </Section>

            <Section style={styles.ctaWrap}>
              <Button href={agendaUrl} style={styles.button}>
                {fr ? 'Voir mon agenda' : 'View my schedule'}
              </Button>
            </Section>

            <Text style={styles.footer}>
              {fr
                ? 'Cet email vous est envoyé automatiquement pour vous rappeler votre séance à venir.'
                : 'This email was sent automatically to remind you of your upcoming session.'}
            </Text>
            <Text style={styles.footer}>
              <Link href={agendaUrl} style={styles.link}>
                {fr ? 'Ouvrir MagicHango' : 'Open MagicHango'}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    padding: '24px 12px',
    backgroundColor: '#f5f1ea',
    fontFamily: 'Tahoma, Geneva, Verdana, Arial, sans-serif',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '28px 24px',
    border: '1px solid #e8e0d4',
  },
  eyebrow: {
    margin: '0 0 8px',
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#7a5b2e',
  },
  title: {
    margin: '0 0 16px',
    fontSize: '28px',
    lineHeight: '1.1',
    color: '#1f1a14',
  },
  paragraph: {
    margin: '0 0 12px',
    fontSize: '14px',
    lineHeight: '22px',
    color: '#43372a',
  },
  details: {
    marginTop: '20px',
    padding: '16px',
    borderRadius: '18px',
    backgroundColor: '#faf7f2',
    border: '1px solid #ece3d7',
  },
  detailLine: {
    margin: '0 0 8px',
    fontSize: '14px',
    lineHeight: '22px',
    color: '#2f271f',
  },
  ctaWrap: {
    paddingTop: '20px',
    textAlign: 'center',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#1f1a14',
    color: '#ffffff',
    padding: '14px 22px',
    borderRadius: '999px',
    textDecoration: 'none',
    fontSize: '13px',
    lineHeight: '16px',
    fontWeight: 700,
  },
  footer: {
    margin: '16px 0 0',
    fontSize: '12px',
    lineHeight: '18px',
    color: '#73685d',
    textAlign: 'center',
  },
  link: {
    color: '#1f1a14',
    textDecoration: 'underline',
  },
  inlineLink: {
    color: '#1f1a14',
    textDecoration: 'underline',
  },
};
