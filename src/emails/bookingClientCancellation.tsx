import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

type BookingClientCancellationEmailProps = {
  firstName?: string | null;
  agencyName?: string | null;
  locale?: 'fr' | 'en';
  appUrl?: string;
  instructorName?: string | null;
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

export default function BookingClientCancellationEmail({
  firstName,
  agencyName,
  locale = 'fr',
  instructorName,
  serviceName,
  date,
  startTime,
  endTime,
  address,
  cancelledByName,
  cancelledByRole,
  scheduleUrl = 'http://localhost:3000/fr/myweek',
}: BookingClientCancellationEmailProps) {
  const fr = isFr(locale);
  const previewText = fr
    ? 'Votre séance a été annulée.'
    : 'Your lesson has been cancelled.';
  const formattedDate = formatDate(date, fr ? 'fr' : 'en');
  const greeting = firstName?.trim()
    ? fr
      ? `Bonjour ${firstName}`
      : `Hi ${firstName}`
    : fr
      ? 'Bonjour'
      : 'Hi';
  const canceller =
    cancelledByName?.trim() ||
    (cancelledByRole === 'instructor'
      ? instructorName?.trim()
      : cancelledByRole === 'student'
        ? firstName?.trim()
        : null);

  const intro = fr
    ? `Le créneau ${serviceName ? `"${serviceName}" ` : ''}prévu${agencyName ? ` chez ${agencyName}` : ''} a été annulé.`
    : `The ${serviceName ? `"${serviceName}" ` : ''}slot${agencyName ? ` with ${agencyName}` : ''} has been cancelled.`;

  const actorLine = canceller
    ? fr
      ? `Annulé par : ${canceller}`
      : `Cancelled by: ${canceller}`
    : null;

  const timeLine =
    startTime && endTime
      ? `${startTime} - ${endTime}`
      : startTime || endTime || null;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.title}>
            {fr ? 'Séance annulée' : 'Lesson cancelled'}
          </Heading>

          <Text style={styles.text}>{greeting}</Text>
          <Text style={styles.text}>{intro}</Text>

          <Section style={styles.card}>
            {serviceName ? (
              <Text style={styles.detail}>
                <strong>{fr ? 'Service :' : 'Service:'}</strong> {serviceName}
              </Text>
            ) : null}
            {instructorName ? (
              <Text style={styles.detail}>
                <strong>{fr ? 'Éducateur :' : 'Trainer:'}</strong> {instructorName}
              </Text>
            ) : null}
            {formattedDate ? (
              <Text style={styles.detail}>
                <strong>{fr ? 'Date :' : 'Date:'}</strong> {formattedDate}
              </Text>
            ) : null}
            {timeLine ? (
              <Text style={styles.detail}>
                <strong>{fr ? 'Horaire :' : 'Time:'}</strong> {timeLine}
              </Text>
            ) : null}
            {address ? (
              <Text style={styles.detail}>
                <strong>{fr ? 'Adresse :' : 'Address:'}</strong> {address}
              </Text>
            ) : null}
            {actorLine ? <Text style={styles.detail}>{actorLine}</Text> : null}
          </Section>

          <Text style={styles.text}>
            {fr
              ? 'Vous pouvez consulter votre semaine pour vérifier les autres rendez-vous.'
              : 'You can review your schedule to check your other appointments.'}
          </Text>

          <Section style={styles.ctaWrap}>
            <Button href={scheduleUrl} style={styles.button}>
              {fr ? 'Voir ma semaine' : 'View my schedule'}
            </Button>
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
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '28px 24px',
    border: '1px solid #e5ded1',
  },
  title: {
    margin: '0 0 16px',
    fontSize: '28px',
    lineHeight: '1.1',
    color: '#30261a',
  },
  text: {
    margin: '0 0 14px',
    fontSize: '14px',
    lineHeight: '22px',
    color: '#4b3d2c',
  },
  card: {
    backgroundColor: '#fbf8f3',
    border: '1px solid #eadfce',
    borderRadius: '16px',
    padding: '16px',
    margin: '18px 0',
  },
  detail: {
    margin: '0 0 8px',
    fontSize: '14px',
    lineHeight: '22px',
    color: '#30261a',
  },
  ctaWrap: {
    paddingTop: '10px',
  },
  button: {
    backgroundColor: '#30261a',
    color: '#fffaf2',
    textDecoration: 'none',
    borderRadius: '999px',
    padding: '12px 20px',
    fontSize: '13px',
    fontWeight: 700,
  },
};
