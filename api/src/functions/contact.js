const { app } = require('@azure/functions');
const { EmailClient } = require('@azure/communication-email');

// Required application settings (set these in the Static Web App's
// "Environment variables" / API application settings in the Azure Portal):
//   ACS_CONNECTION_STRING   - connection string from your Azure Communication
//                             Services resource (Keys blade)
//   ACS_SENDER_ADDRESS      - a verified "from" address from your ACS Email
//                             Communication Service (e.g.
//                             DoNotReply@<your-guid>.azurecomm.net, or a
//                             custom domain address once you've verified one)
//   CONTACT_TO_ADDRESS      - where enquiries get sent, e.g.
//                             aces_autos@yahoo.com.au

const TO_ADDRESS = process.env.CONTACT_TO_ADDRESS || 'aces_autos@yahoo.com.au';

function clean(value) {
  return (value ?? '').toString().trim();
}

app.http('contact', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'contact',
  handler: async (request, context) => {
    let form;
    try {
      form = await request.formData();
    } catch (err) {
      context.error('Failed to parse form data', err);
      return { status: 400, jsonBody: { ok: false, error: 'Invalid form submission.' } };
    }

    // Honeypot: bots fill every field, humans never see this one.
    if (clean(form.get('website'))) {
      return { status: 200, jsonBody: { ok: true } };
    }

    const name = clean(form.get('name'));
    const phone = clean(form.get('phone'));
    const email = clean(form.get('email'));
    const service = clean(form.get('service'));
    const message = clean(form.get('message'));

    const errors = [];
    if (!name) errors.push('Name is required.');
    if (!phone && !email) errors.push('A phone number or email address is required.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address.');
    }
    if (errors.length) {
      return { status: 422, jsonBody: { ok: false, error: errors.join(' ') } };
    }

    const connectionString = process.env.ACS_CONNECTION_STRING;
    const senderAddress = process.env.ACS_SENDER_ADDRESS;

    if (!connectionString || !senderAddress) {
      context.error('Missing ACS_CONNECTION_STRING or ACS_SENDER_ADDRESS app settings');
      return { status: 500, jsonBody: { ok: false, error: 'Email is not configured yet. Please call us directly.' } };
    }

    const subject = `New enquiry from Aces Automotive website${service ? ' — ' + service : ''}`;
    const bodyText = [
      'You have a new enquiry from the Aces Automotive website:',
      '',
      `Name:    ${name}`,
      `Phone:   ${phone || '-'}`,
      `Email:   ${email || '-'}`,
      `Service: ${service || '-'}`,
      'Message:',
      message || '-',
      '',
      '---',
      `Submitted: ${new Date().toISOString()}`,
    ].join('\n');

    try {
      const client = new EmailClient(connectionString);
      const poller = await client.beginSend({
        senderAddress,
        content: {
          subject,
          plainText: bodyText,
        },
        recipients: {
          to: [{ address: TO_ADDRESS }],
        },
        replyTo: email ? [{ address: email, displayName: name }] : undefined,
      });
      await poller.pollUntilDone();
      return { status: 200, jsonBody: { ok: true } };
    } catch (err) {
      context.error('ACS email send failed', err);
      return { status: 500, jsonBody: { ok: false, error: 'Could not send the message. Please try again or call us directly.' } };
    }
  },
});
