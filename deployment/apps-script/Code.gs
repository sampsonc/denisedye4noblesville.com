const VOLUNTEER_SHEET = 'Volunteer Intake';
const YARD_SIGN_SHEET = 'Yard Signs';
const NOTIFY_EMAIL = 'denisedye4noblesville@gmail.com';
const CAMPAIGN_TIME_ZONE = 'America/Indiana/Indianapolis';

// Requires the website update (honeypot/time/token fields) to be live first,
// or real sign-ups will be rejected.
const REQUIRE_PAGE_TOKEN = true;
const PAGE_TOKEN = 'td2026';

function doPost(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};

    if (isSpam(p)) {
      console.log('Blocked spam: ' + JSON.stringify(p).slice(0, 500));
      return ContentService.createTextOutput('ok');
    }

    sanitizeForSheet(e);

    const formType = p.form_type || 'join_team';

    if (formType === 'yard_sign') {
      return handleYardSign(e);
    }

    return handleVolunteer(e);

  } catch (err) {
    console.error(err);

    return HtmlService.createHtmlOutput(
      '<!doctype html>' +
      '<html>' +
      '<body style="font-family:Arial;text-align:center;padding:50px">' +
      '<h2>We are sorry — something went wrong.</h2>' +
      '<p>Please try again or contact the campaign directly.</p>' +
      '</body>' +
      '</html>'
    );
  }
}

function isSpam(p) {
  // The website requires a phone number with at least 10 digits.
  const digits = String(p.mobile_phone || '').replace(/\D/g, '');
  if (digits.length < 10) return true;

  // The bot fills first name, last name and neighborhood with exactly
  // 10 random lowercase letters.
  const junk = /^[a-z]{10}$/;
  if (junk.test(p.first_name || '') &&
      junk.test(p.last_name || '') &&
      junk.test(p.neighborhood || '')) return true;

  // Hidden honeypot field; people never see it, so it stays empty.
  if (p.website || p._gotcha) return true;

  if (REQUIRE_PAGE_TOKEN) {
    if (p._token !== PAGE_TOKEN) return true;
    // _t = milliseconds the visitor spent on the page before submitting.
    if (!(Number(p._t) >= 2000)) return true;
  }

  return false;
}

// Stop typed values like "=..." or "+1 317..." being treated as formulas.
function sanitizeForSheet(e) {
  const clean = v => {
    v = String(v);
    return /^[=+\-@]/.test(v) ? "'" + v : v;
  };
  Object.keys(e.parameter || {}).forEach(k => {
    e.parameter[k] = clean(e.parameter[k]);
  });
  Object.keys(e.parameters || {}).forEach(k => {
    e.parameters[k] = e.parameters[k].map(clean);
  });
}


/* =========================================================
   VOLUNTEER FORM
   ========================================================= */

function handleVolunteer(e) {

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(VOLUNTEER_SHEET);

  if (!sheet) {
    throw new Error('Sheet "' + VOLUNTEER_SHEET + '" not found.');
  }

  const p = e && e.parameter ? e.parameter : {};

  const multi = key =>
    e.parameters && e.parameters[key]
      ? e.parameters[key].join(', ')
      : (p[key] || '');

  const now = new Date();

const id =
  'V-' +
  Utilities.formatDate(
    now,
    CAMPAIGN_TIME_ZONE,
    'yyyyMMdd-HHmmss'
  );

  const row = [
    id,                         // A Volunteer ID
    now,                        // B Date Joined
    p.first_name || '',         // C First Name
    p.last_name || '',          // D Last Name
    p.email || '',              // E Email
    p.mobile_phone || '',       // F Mobile Phone
    p.neighborhood || '',       // G Neighborhood
    multi('help'),              // H Ways to Help
    multi('availability'),      // I Availability
    p.frequency || '',          // J Frequency
    multi('skills'),            // K Skills
    p.skills_other || '',       // L Other Skill
    p.sms_consent || '',        // M SMS Consent
    p.notes || '',              // N Notes
    'New',                      // O Status
    '',                         // P Owner
    '',                         // Q Last Contact
    '',                         // R Next Follow-Up
    'No',                       // S Welcome Email Sent
    ''                          // T Welcome Email Date
  ];

  sheet.appendRow(row);

  const newRow = sheet.getLastRow();


  // -------------------------
  // Notify campaign inbox
  // -------------------------

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,

    subject:
      'New Team Denise volunteer: ' +
      (p.first_name || '') +
      ' ' +
      (p.last_name || ''),

    body:
      'A new volunteer has submitted the website form.\n\n' +

      'Volunteer ID: ' + id + '\n' +

      'Name: ' +
      (p.first_name || '') +
      ' ' +
      (p.last_name || '') +
      '\n' +

      'Email: ' + (p.email || '') + '\n' +

      'Phone: ' + (p.mobile_phone || '') + '\n' +

      'Neighborhood: ' + (p.neighborhood || '') + '\n' +

      'Ways to help: ' + multi('help') + '\n' +

      'Availability: ' + multi('availability') + '\n' +

      'Frequency: ' + (p.frequency || '') + '\n' +

      'Skills: ' + multi('skills') + '\n' +

      'SMS consent: ' + (p.sms_consent || '') + '\n\n' +

      'Notes:\n' + (p.notes || '')
  });


  // -------------------------
  // Volunteer welcome email
  // -------------------------

  if (p.email) {

    const waysToHelp =
      multi('help') || 'the campaign';

    const welcomeBody =
      'Hi ' +
      (p.first_name || 'there') +
      ',\n\n' +

      'Thank you for signing up to help with Denise Dye’s campaign for Noblesville School Board! ' +
      'We’re excited to have you on the team.\n\n' +

      'You indicated that you’re interested in helping with ' +
      waysToHelp +
      ', and we’ll keep that in mind as we coordinate upcoming volunteer opportunities.\n\n' +

      'We’ll be in touch soon with ways you can get involved. ' +
      'Whether you have 30 minutes or several hours to give, ' +
      'we appreciate your willingness to help.\n\n' +

      'Thank you for supporting Denise and our Noblesville schools!\n\n' +

      'Team Denise\n' +
      'Denise Dye for Noblesville School Board';


    MailApp.sendEmail(
      p.email,
      NOTIFY_EMAIL,
      'Thanks for joining Team Denise!',
      welcomeBody
    );


    // S = Welcome Email Sent
    // T = Welcome Email Date

    sheet
      .getRange(newRow, 19)
      .setValue('Yes');

    sheet
      .getRange(newRow, 20)
      .setValue(new Date());
  }


  return HtmlService.createHtmlOutput(
    '<!doctype html>' +
    '<html>' +
    '<body style="font-family:Arial;text-align:center;padding:50px">' +

    '<h2>Thank you for joining Team Denise!</h2>' +

    '<p>We received your information and will be in touch soon.</p>' +

    '<p>' +
    '<a href="https://denisedye4noblesville.com/">' +
    'Return to the campaign website' +
    '</a>' +
    '</p>' +

    '</body>' +
    '</html>'
  );
}


/* =========================================================
   YARD SIGN FORM
   ========================================================= */

function handleYardSign(e) {

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(YARD_SIGN_SHEET);

  if (!sheet) {
    throw new Error('Sheet "' + YARD_SIGN_SHEET + '" not found.');
  }

  const p = e && e.parameter ? e.parameter : {};

  const now = new Date();


  const fullName =
    (
      (p.first_name || '') +
      ' ' +
      (p.last_name || '')
    ).trim();


  const fullAddress =
    [
      p.street_address || '',
      p.city || '',
      p.zip || ''
    ]
    .filter(Boolean)
    .join(', ');


  const combinedNotes =
    [
      p.placement_notes
        ? 'Placement: ' + p.placement_notes
        : '',

      p.notes || ''
    ]
    .filter(Boolean)
    .join(' | ');


  /*
    Yard Signs tab columns:

    A Name
    B Phone
    C Email
    D Address
    E Requested Date
    F Quantity
    G Status
    H Delivery Date
    I Delivered By
    J Notes
  */

  sheet.appendRow([
    fullName,                   // A
    p.mobile_phone || '',       // B
    p.email || '',              // C
    fullAddress,                // D
    now,                        // E
    p.sign_count || '1',        // F
    'Requested',                // G
    '',                         // H
    '',                         // I
    combinedNotes               // J
  ]);


  // -------------------------
  // Notify campaign inbox
  // -------------------------

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,

    subject:
      'New yard sign request: ' +
      fullName,

    body:
      'A new yard sign request was submitted.\n\n' +

      'Name: ' + fullName + '\n' +

      'Email: ' +
      (p.email || '') +
      '\n' +

      'Phone: ' +
      (p.mobile_phone || '') +
      '\n' +

      'Address: ' +
      fullAddress +
      '\n' +

      'Quantity: ' +
      (p.sign_count || '1') +
      '\n' +

      'Placement notes: ' +
      (p.placement_notes || '') +
      '\n\n' +

      'Other notes:\n' +
      (p.notes || '')
  });


  // -------------------------
  // Requester confirmation
  // -------------------------

  if (p.email) {

    const confirmationBody =
      'Hi ' +
      (p.first_name || 'there') +
      ',\n\n' +

      'Thanks for requesting a Denise Dye yard sign. ' +
      'We received your request for ' +
      (p.sign_count || '1') +
      ' sign(s) at:\n\n' +

      fullAddress +
      '\n\n' +

      'A Team Denise volunteer will coordinate delivery.\n\n' +

      'Thank you for supporting Denise!\n\n' +

      'Team Denise\n' +
      'Denise Dye for Noblesville School Board';


    MailApp.sendEmail(
      p.email,
      NOTIFY_EMAIL,
      'We received your Team Denise yard sign request',
      confirmationBody
    );
  }


  return HtmlService.createHtmlOutput(
    '<!doctype html>' +
    '<html>' +
    '<body style="font-family:Arial;text-align:center;padding:50px">' +

    '<h2>Thank you for supporting Denise!</h2>' +

    '<p>Your yard sign request has been received.</p>' +

    '<p>' +
    '<a href="https://denisedye4noblesville.com/">' +
    'Return to the campaign website' +
    '</a>' +
    '</p>' +

    '</body>' +
    '</html>'
  );
}


/* =========================================================
   OPTIONAL EMAIL TEST
   You may delete this later.
   ========================================================= */

function testEmail() {

  MailApp.sendEmail(
    NOTIFY_EMAIL,
    'TEST — Team Denise Campaign HQ',
    'This is a test email from the Denise Campaign Working HQ Apps Script.'
  );
}
function sendYardSignAssignments() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const yardSheet = ss.getSheetByName('Yard Signs');
  const volunteerSheet = ss.getSheetByName('Volunteer Intake');

  if (!yardSheet || !volunteerSheet) {
    throw new Error('Yard Signs or Volunteer Intake sheet not found.');
  }

  const yardData = yardSheet.getDataRange().getValues();
  const volunteerData = volunteerSheet.getDataRange().getValues();

  // Build volunteer lookup:
  // Volunteer Intake:
  // C = First Name
  // D = Last Name
  // E = Email
  // U = Volunteer Name
  const volunteerLookup = {};

  for (let i = 1; i < volunteerData.length; i++) {
    const firstName = volunteerData[i][2];
    const lastName = volunteerData[i][3];
    const email = volunteerData[i][4];

    const fullName =
      ((firstName || '') + ' ' + (lastName || '')).trim();

    if (fullName && email) {
      volunteerLookup[fullName] = email;
    }
  }

  // Yard Signs:
  // A Name
  // B Phone
  // C Email
  // D Address
  // E Requested Date
  // F Quantity
  // G Status
  // H Delivery Date
  // I Assigned To
  // J Notes
  // K Assigned Date
  // L Delivery Notes
  // M Assignment Email Sent
  // N Assignment Email Date

  for (let i = 1; i < yardData.length; i++) {

    const rowNumber = i + 1;

    const residentName = yardData[i][0];
    const residentPhone = yardData[i][1];
    const address = yardData[i][3];
    const quantity = yardData[i][5];
    const status = yardData[i][6];
    const assignedTo = yardData[i][8];
    const notes = yardData[i][9];
    const emailSent = yardData[i][12];

    // Only process newly assigned requests
    if (
      status === 'Assigned' &&
      assignedTo &&
      !emailSent
    ) {

      const volunteerEmail =
        volunteerLookup[assignedTo];

      // Don't mark it sent if we can't find an email.
      if (!volunteerEmail) {
        console.log(
          'No volunteer email found for: ' + assignedTo
        );
        continue;
      }

      const subject =
        'Team Denise — Yard Sign Delivery Assignment';

      const body =
        'Hi ' + assignedTo.split(' ')[0] + ',\n\n' +

        'You have a new Team Denise yard-sign delivery assignment.\n\n' +

        'DELIVERY DETAILS\n\n' +

        'Deliver to: ' + address + '\n' +

        'Signs: ' + (quantity || '1') + '\n' +

        'Resident: ' + (residentName || '') + '\n' +

        'Phone: ' + (residentPhone || '') + '\n' +

        'Notes: ' + (notes || 'None') + '\n\n' +

        'Please coordinate the delivery and let the campaign know when it has been completed.\n\n' +

        'If you have any questions, reply to this email.\n\n' +

        'Thank you!\n\n' +

        'Team Denise\n' +
        'Denise Dye for Noblesville School Board';

      MailApp.sendEmail(
        volunteerEmail,
        NOTIFY_EMAIL,
        subject,
        body
      );

      // K = Assigned Date
      // Only add it if it is currently blank.
      if (!yardData[i][10]) {
        yardSheet
          .getRange(rowNumber, 11)
          .setValue(new Date());
      }

      // M = Assignment Email Sent
      yardSheet
        .getRange(rowNumber, 13)
        .setValue('Yes');

      // N = Assignment Email Date
      yardSheet
        .getRange(rowNumber, 14)
        .setValue(new Date());
    }
  }
}function stampDeliveredYardSigns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Yard Signs');

  if (!sheet) {
    throw new Error('Sheet "Yard Signs" not found.');
  }

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const rowNumber = i + 1;

    const status = data[i][6];       // G
    const deliveryDate = data[i][7]; // H

    if (status === 'Delivered' && !deliveryDate) {
      sheet.getRange(rowNumber, 8).setValue(new Date());
    }
  }
}function sendDoorKnockingAssignments() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const taskSheet = ss.getSheetByName('Volunteer Tasks');
  const doorSheet = ss.getSheetByName('Door Knocking');

  if (!taskSheet || !doorSheet) {
    throw new Error('Volunteer Tasks or Door Knocking sheet not found.');
  }

  const taskData = taskSheet.getDataRange().getValues();
  const doorData = doorSheet.getDataRange().getValues();

  // Build lookup by Canvass ID from Door Knocking column S
  const canvassLookup = {};

  for (let i = 1; i < doorData.length; i++) {
    const canvassId = doorData[i][18]; // S
    if (!canvassId) continue;

    canvassLookup[canvassId] = {
      neighborhood: doorData[i][0],   // A
      date: doorData[i][1],           // B
      startTime: doorData[i][2],      // C
      endTime: doorData[i][3],        // D
      meetingLocation: doorData[i][4],// E
      volunteerLead: doorData[i][5]   // F
    };
  }

  for (let i = 1; i < taskData.length; i++) {
    const rowNumber = i + 1;

    const task = taskData[i][0];       // A
    const category = taskData[i][1];   // B
    const volunteer = taskData[i][2];  // C
    const email = taskData[i][3];      // D
    const canvassId = taskData[i][5];  // F
    const status = taskData[i][9];     // J
    const notes = taskData[i][14];     // O

    if (
      category !== 'Door Knocking' ||
      status !== 'Assigned' ||
      !volunteer ||
      !email ||
      !canvassId
    ) {
      continue;
    }

    // Use Notes marker to prevent duplicate assignment emails
    if (String(notes || '').includes('[Canvass Assignment Email Sent]')) {
      continue;
    }

    const canvass = canvassLookup[canvassId];

    if (!canvass) {
      console.log('No canvass found for: ' + canvassId);
      continue;
    }

    const tz = 'America/Indiana/Indianapolis';

    const eventDate =
      canvass.date instanceof Date
        ? Utilities.formatDate(canvass.date, tz, 'EEEE, MMMM d, yyyy')
        : canvass.date;

    const startTime =
      canvass.startTime instanceof Date
        ? Utilities.formatDate(canvass.startTime, tz, 'h:mm a')
        : canvass.startTime;

    const endTime =
      canvass.endTime instanceof Date
        ? Utilities.formatDate(canvass.endTime, tz, 'h:mm a')
        : canvass.endTime;

    const firstName = volunteer.split(' ')[0];

    const subject = 'Team Denise — Door Knocking Assignment';

    const body =
      'Hi ' + firstName + ',\n\n' +
      'You have a new Team Denise door-knocking assignment.\n\n' +
      'CANVASS DETAILS\n\n' +
      'Area: ' + (canvass.neighborhood || '') + '\n' +
      'Date: ' + (eventDate || '') + '\n' +
      'Time: ' + (startTime || '') +
        (endTime ? ' - ' + endTime : '') + '\n' +
      'Meeting location: ' + (canvass.meetingLocation || '') + '\n' +
      'Volunteer lead: ' + (canvass.volunteerLead || '') + '\n' +
      'Task: ' + (task || 'Door knocking') + '\n\n' +
      'Please reply to this email if you have any questions.\n\n' +
      'Thank you!\n\n' +
      'Team Denise\n' +
      'Denise Dye for Noblesville School Board';

    MailApp.sendEmail(
      email,
      NOTIFY_EMAIL,
      subject,
      body
    );

    // G = Assigned Date
    if (!taskData[i][6]) {
      taskSheet.getRange(rowNumber, 7).setValue(new Date());
    }

    // Add a marker to Notes so the email is not sent twice
    const existingNotes = notes ? String(notes) + '\n' : '';

    taskSheet
      .getRange(rowNumber, 15)
      .setValue(existingNotes + '[Canvass Assignment Email Sent]');
  }
}

function sendDoorKnockingTwoDayReminders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const taskSheet = ss.getSheetByName('Volunteer Tasks');
  const doorSheet = ss.getSheetByName('Door Knocking');

  if (!taskSheet || !doorSheet) {
    throw new Error('Volunteer Tasks or Door Knocking sheet not found.');
  }

  const taskData = taskSheet.getDataRange().getValues();
  const doorData = doorSheet.getDataRange().getValues();

  const tz = 'America/Indiana/Indianapolis';

  // Build canvass lookup from Door Knocking
  // S = Canvass ID
  const canvassLookup = {};

  for (let i = 1; i < doorData.length; i++) {
    const canvassId = doorData[i][18]; // S

    if (!canvassId) continue;

    canvassLookup[String(canvassId).trim()] = {
      neighborhood: doorData[i][0],    // A
      date: doorData[i][1],            // B
      startTime: doorData[i][2],       // C
      endTime: doorData[i][3],         // D
      meetingLocation: doorData[i][4], // E
      volunteerLead: doorData[i][5]    // F
    };
  }

  // Convert a Date into an Eastern calendar-day number.
  function easternDayNumber(dateValue) {
    const ymd = Utilities.formatDate(dateValue, tz, 'yyyy-MM-dd');
    const parts = ymd.split('-');

    return Date.UTC(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    ) / 86400000;
  }

  const todayNumber = easternDayNumber(new Date());

  for (let i = 1; i < taskData.length; i++) {
    const rowNumber = i + 1;

    const category = String(taskData[i][1] || '').trim(); // B
    const volunteer = String(taskData[i][2] || '').trim(); // C
    const email = String(taskData[i][3] || '').trim(); // D
    const canvassId = String(taskData[i][5] || '').trim(); // F
    const status = String(taskData[i][9] || '').trim(); // J
    const reminderSent = taskData[i][10]; // K

    if (category !== 'Door Knocking') continue;
    if (!volunteer || !email || !canvassId) continue;
    if (reminderSent) continue;

    if (
      status === 'Completed' ||
      status === 'Declined' ||
      status === 'Cancelled'
    ) {
      continue;
    }

    const canvass = canvassLookup[canvassId];

    if (!canvass) {
      console.log('No canvass found for ' + canvassId);
      continue;
    }

    if (!(canvass.date instanceof Date)) {
      console.log('Canvass date is not a valid date for ' + canvassId);
      continue;
    }

    const eventNumber = easternDayNumber(canvass.date);
    const daysUntil = eventNumber - todayNumber;

    console.log(
      canvassId +
      ' | daysUntil=' +
      daysUntil +
      ' | volunteer=' +
      volunteer
    );

    if (daysUntil !== 2) {
      continue;
    }

    const formattedDate =
      Utilities.formatDate(
        canvass.date,
        tz,
        'EEEE, MMMM d, yyyy'
      );

    const startTime =
      canvass.startTime instanceof Date
        ? Utilities.formatDate(canvass.startTime, tz, 'h:mm a')
        : canvass.startTime;

    const endTime =
      canvass.endTime instanceof Date
        ? Utilities.formatDate(canvass.endTime, tz, 'h:mm a')
        : canvass.endTime;

    const firstName = volunteer.split(' ')[0];

    const subject =
      'Reminder — Team Denise Door Knocking in 2 Days';

    const body =
      'Hi ' + firstName + ',\n\n' +

      'Just a reminder that your Team Denise door-knocking assignment is coming up in two days.\n\n' +

      'CANVASS DETAILS\n\n' +

      'Area: ' + (canvass.neighborhood || '') + '\n' +

      'Date: ' + formattedDate + '\n' +

      'Time: ' +
      (startTime || '') +
      (endTime ? ' - ' + endTime : '') +
      '\n' +

      'Meeting location: ' +
      (canvass.meetingLocation || '') +
      '\n' +

      'Volunteer lead: ' +
      (canvass.volunteerLead || '') +
      '\n\n' +

      'Thank you for helping Team Denise reach Noblesville voters!\n\n' +

      'If your availability has changed, please reply to this email.\n\n' +

      'Team Denise\n' +
      'Denise Dye for Noblesville School Board';

    MailApp.sendEmail(
      email,
      NOTIFY_EMAIL,
      subject,
      body
    );

    // K = Email Reminder
    taskSheet
      .getRange(rowNumber, 11)
      .setValue(new Date());
  }
}

function sendDoorKnockingDayOfReminders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const taskSheet = ss.getSheetByName('Volunteer Tasks');
  const doorSheet = ss.getSheetByName('Door Knocking');

  if (!taskSheet || !doorSheet) {
    throw new Error('Volunteer Tasks or Door Knocking sheet not found.');
  }

  const taskData = taskSheet.getDataRange().getValues();
  const doorData = doorSheet.getDataRange().getValues();

  const tz = 'America/Indiana/Indianapolis';

  // Build Canvass ID lookup from Door Knocking
  const canvassLookup = {};

  for (let i = 1; i < doorData.length; i++) {
    const canvassId = doorData[i][18]; // S

    if (!canvassId) continue;

    canvassLookup[String(canvassId).trim()] = {
      neighborhood: doorData[i][0],    // A
      date: doorData[i][1],            // B
      startTime: doorData[i][2],       // C
      endTime: doorData[i][3],         // D
      meetingLocation: doorData[i][4], // E
      volunteerLead: doorData[i][5]    // F
    };
  }

  function easternDayNumber(dateValue) {
    const ymd = Utilities.formatDate(dateValue, tz, 'yyyy-MM-dd');
    const parts = ymd.split('-');

    return Date.UTC(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    ) / 86400000;
  }

  const todayNumber = easternDayNumber(new Date());

  for (let i = 1; i < taskData.length; i++) {
    const rowNumber = i + 1;

    const category = String(taskData[i][1] || '').trim(); // B
    const volunteer = String(taskData[i][2] || '').trim(); // C
    const email = String(taskData[i][3] || '').trim(); // D
    const canvassId = String(taskData[i][5] || '').trim(); // F
    const status = String(taskData[i][9] || '').trim(); // J
    const dayOfSent = taskData[i][12]; // M

    if (category !== 'Door Knocking') continue;
    if (!volunteer || !email || !canvassId) continue;
    if (dayOfSent) continue;

    if (
      status === 'Completed' ||
      status === 'Declined' ||
      status === 'Cancelled'
    ) {
      continue;
    }

    const canvass = canvassLookup[canvassId];

    if (!canvass) {
      console.log('No canvass found for ' + canvassId);
      continue;
    }

    if (!(canvass.date instanceof Date)) {
      console.log('Canvass date is not valid for ' + canvassId);
      continue;
    }

    const eventNumber = easternDayNumber(canvass.date);
    const daysUntil = eventNumber - todayNumber;

    console.log(
      canvassId +
      ' | daysUntil=' +
      daysUntil +
      ' | volunteer=' +
      volunteer
    );

    // Day-of only
    if (daysUntil !== 0) {
      continue;
    }

    const formattedDate =
      Utilities.formatDate(
        canvass.date,
        tz,
        'EEEE, MMMM d, yyyy'
      );

    const startTime =
      canvass.startTime instanceof Date
        ? Utilities.formatDate(canvass.startTime, tz, 'h:mm a')
        : canvass.startTime;

    const endTime =
      canvass.endTime instanceof Date
        ? Utilities.formatDate(canvass.endTime, tz, 'h:mm a')
        : canvass.endTime;

    const firstName = volunteer.split(' ')[0];

    const subject =
      'Today — Team Denise Door Knocking Reminder';

    const body =
      'Hi ' + firstName + ',\n\n' +

      'Just a reminder that your Team Denise door-knocking assignment is today.\n\n' +

      'CANVASS DETAILS\n\n' +

      'Area: ' + (canvass.neighborhood || '') + '\n' +

      'Date: ' + formattedDate + '\n' +

      'Time: ' +
      (startTime || '') +
      (endTime ? ' - ' + endTime : '') +
      '\n' +

      'Meeting location: ' +
      (canvass.meetingLocation || '') +
      '\n' +

      'Volunteer lead: ' +
      (canvass.volunteerLead || '') +
      '\n\n' +

      'Thank you for helping Team Denise today!\n\n' +

      'If you have any last-minute questions or your availability has changed, please reply to this email.\n\n' +

      'Team Denise\n' +
      'Denise Dye for Noblesville School Board';

    MailApp.sendEmail(
      email,
      NOTIFY_EMAIL,
      subject,
      body
    );

    // M = Day-of Reminder
    taskSheet
      .getRange(rowNumber, 13)
      .setValue(new Date());
  }
}

function assignPermanentCanvassIds() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Door Knocking');

  if (!sheet) {
    throw new Error('Sheet "Door Knocking" not found.');
  }

  const lastRow = sheet.getLastRow();

  for (let row = 2; row <= lastRow; row++) {
    const neighborhood = sheet.getRange(row, 1).getValue();   // A
    const canvassId = sheet.getRange(row, 19).getValue();     // S

    if (neighborhood && !canvassId) {
      const newId = 'CAN-' + String(row - 1).padStart(4, '0');

      sheet.getRange(row, 19).setValue(newId);

      console.log(
        'Assigned ' + newId + ' to row ' + row
      );
    }
  }
}function completeDoorKnockingTasks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const doorSheet = ss.getSheetByName('Door Knocking');
  const taskSheet = ss.getSheetByName('Volunteer Tasks');

  if (!doorSheet || !taskSheet) {
    throw new Error('Door Knocking or Volunteer Tasks sheet not found.');
  }

  const doorData = doorSheet.getDataRange().getValues();
  const taskData = taskSheet.getDataRange().getValues();

  // Build list of completed Canvass IDs.
  // Door Knocking:
  // M = Status
  // S = Canvass ID

  const completedCanvasses = {};

  for (let i = 1; i < doorData.length; i++) {
    const status = String(doorData[i][12] || '').trim();
    const canvassId = String(doorData[i][18] || '').trim();

    if (status === 'Completed' && canvassId) {
      completedCanvasses[canvassId] = true;
    }
  }

  // Volunteer Tasks:
  // B = Category
  // F = Canvass ID
  // J = Status
  // N = Completed Date

  for (let i = 1; i < taskData.length; i++) {
    const rowNumber = i + 1;

    const category = String(taskData[i][1] || '').trim();
    const canvassId = String(taskData[i][5] || '').trim();
    const taskStatus = String(taskData[i][9] || '').trim();
    const completedDate = taskData[i][13];

    if (
      category === 'Door Knocking' &&
      completedCanvasses[canvassId] &&
      taskStatus !== 'Completed' &&
      taskStatus !== 'Declined' &&
      taskStatus !== 'Cancelled'
    ) {
      // J = Completed
      taskSheet
        .getRange(rowNumber, 10)
        .setValue('Completed');

      // N = Completed Date
      if (!completedDate) {
        taskSheet
          .getRange(rowNumber, 14)
          .setValue(new Date());
      }
    }
  }
}
function sendGeneralTaskAssignments() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Volunteer Tasks');

  if (!sheet) {
    throw new Error('Sheet "Volunteer Tasks" not found.');
  }

  const data = sheet.getDataRange().getValues();
  const tz = 'America/Indiana/Indianapolis';

  /*
    Volunteer Tasks:

    A Task
    B Category
    C Volunteer
    D Email
    E Phone
    F Event / Project / Canvass ID
    G Assigned Date
    H Due Date
    I Priority
    J Status
    K Email Reminder
    L Text Reminder
    M Day-of Reminder
    N Completed Date
    O Notes
    P Assignment Email Sent
    Q Assignment Email Date
  */

  for (let i = 1; i < data.length; i++) {

    const rowNumber = i + 1;

    const task = String(data[i][0] || '').trim();
    const category = String(data[i][1] || '').trim();
    const volunteer = String(data[i][2] || '').trim();
    const email = String(data[i][3] || '').trim();
    const eventProject = String(data[i][5] || '').trim();

    const assignedDate = data[i][6];
    const dueDate = data[i][7];

    const priority = String(data[i][8] || '').trim();
    const status = String(data[i][9] || '').trim();
    const notes = String(data[i][14] || '').trim();

    const assignmentEmailSent =
      String(data[i][15] || '').trim();

    // Door Knocking already has its own specialized automation.
    if (category === 'Door Knocking') {
      continue;
    }

    // Only send complete, newly assigned tasks.
    if (
      !task ||
      !volunteer ||
      !email ||
      status !== 'Assigned' ||
      assignmentEmailSent
    ) {
      continue;
    }

    let formattedDueDate = '';

    if (dueDate instanceof Date) {
      formattedDueDate =
        Utilities.formatDate(
          dueDate,
          tz,
          'EEEE, MMMM d, yyyy'
        );
    } else if (dueDate) {
      formattedDueDate = String(dueDate);
    }

    const firstName =
      volunteer.split(' ')[0];

    const subject =
      'Team Denise — New Volunteer Assignment';

    let body =
      'Hi ' + firstName + ',\n\n' +

      'Thank you for helping Team Denise. You have a new volunteer assignment.\n\n' +

      'ASSIGNMENT DETAILS\n\n' +

      'Task: ' + task + '\n' +

      'Category: ' +
      (category || 'Campaign Support') +
      '\n';

    if (eventProject) {
      body +=
        'Event / Project: ' +
        eventProject +
        '\n';
    }

    if (formattedDueDate) {
      body +=
        'Due Date: ' +
        formattedDueDate +
        '\n';
    }

    if (priority) {
      body +=
        'Priority: ' +
        priority +
        '\n';
    }

    if (notes) {
      body +=
        '\nNotes:\n' +
        notes +
        '\n';
    }

    body +=
      '\nPlease reply to this email if you have any questions or if your availability has changed.\n\n' +

      'Thank you for being part of Team Denise!\n\n' +

      'Team Denise\n' +
      'Denise Dye for Noblesville School Board';


    MailApp.sendEmail(
      email,
      NOTIFY_EMAIL,
      subject,
      body
    );


    // G = Assigned Date
    if (!assignedDate) {
      sheet
        .getRange(rowNumber, 7)
        .setValue(new Date());
    }


    // P = Assignment Email Sent
    sheet
      .getRange(rowNumber, 16)
      .setValue('Yes');


    // Q = Assignment Email Date
    sheet
      .getRange(rowNumber, 17)
      .setValue(new Date());
  }
}
function sendGeneralTaskTwoDayReminders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Volunteer Tasks');

  if (!sheet) {
    throw new Error('Sheet "Volunteer Tasks" not found.');
  }

  const data = sheet.getDataRange().getValues();
  const tz = 'America/Indiana/Indianapolis';

  // Convert a date to an Eastern calendar-day number
  function easternDayNumber(dateValue) {
    const ymd = Utilities.formatDate(dateValue, tz, 'yyyy-MM-dd');
    const parts = ymd.split('-');

    return Date.UTC(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    ) / 86400000;
  }

  const todayNumber = easternDayNumber(new Date());

  for (let i = 1; i < data.length; i++) {

    const rowNumber = i + 1;

    const task = String(data[i][0] || '').trim();       // A
    const category = String(data[i][1] || '').trim();   // B
    const volunteer = String(data[i][2] || '').trim();  // C
    const email = String(data[i][3] || '').trim();      // D
    const eventProject = String(data[i][5] || '').trim(); // F
    const dueDate = data[i][7];                         // H
    const priority = String(data[i][8] || '').trim();   // I
    const status = String(data[i][9] || '').trim();     // J
    const reminderSent = data[i][10];                   // K
    const notes = String(data[i][14] || '').trim();     // O

    // Door Knocking has its own reminder system
    if (category === 'Door Knocking') {
      continue;
    }

    // Skip incomplete or already-reminded tasks
    if (
      !task ||
      !volunteer ||
      !email ||
      !(dueDate instanceof Date) ||
      reminderSent
    ) {
      continue;
    }

    // Don't remind for closed tasks
    if (
      status === 'Completed' ||
      status === 'Declined' ||
      status === 'Cancelled'
    ) {
      continue;
    }

    const dueNumber = easternDayNumber(dueDate);
    const daysUntil = dueNumber - todayNumber;

    console.log(
      task +
      ' | daysUntil=' +
      daysUntil +
      ' | volunteer=' +
      volunteer
    );

    // Send exactly 2 days before due date
    if (daysUntil !== 2) {
      continue;
    }

    const formattedDueDate =
      Utilities.formatDate(
        dueDate,
        tz,
        'EEEE, MMMM d, yyyy'
      );

    const firstName = volunteer.split(' ')[0];

    const subject =
      'Reminder — Team Denise Assignment Due in 2 Days';

    let body =
      'Hi ' + firstName + ',\n\n' +

      'Just a reminder that your Team Denise volunteer assignment is due in two days.\n\n' +

      'ASSIGNMENT DETAILS\n\n' +

      'Task: ' + task + '\n' +

      'Due Date: ' + formattedDueDate + '\n';

    if (category) {
      body += 'Category: ' + category + '\n';
    }

    if (eventProject) {
      body += 'Event / Project: ' + eventProject + '\n';
    }

    if (priority) {
      body += 'Priority: ' + priority + '\n';
    }

    if (notes) {
      body += '\nNotes:\n' + notes + '\n';
    }

    body +=
      '\nIf you have any questions or your availability has changed, please reply to this email.\n\n' +

      'Thank you for helping Team Denise!\n\n' +

      'Team Denise\n' +
      'Denise Dye for Noblesville School Board';

    MailApp.sendEmail(
      email,
      NOTIFY_EMAIL,
      subject,
      body
    );

    // K = Email Reminder
    sheet
      .getRange(rowNumber, 11)
      .setValue(new Date());
  }
}
function stampCompletedVolunteerTasks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Volunteer Tasks');

  if (!sheet) {
    throw new Error('Sheet "Volunteer Tasks" not found.');
  }

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const rowNumber = i + 1;

    const status = String(data[i][9] || '').trim(); // J
    const completedDate = data[i][13];              // N

    if (status === 'Completed' && !completedDate) {
      // N = Completed Date
      sheet
        .getRange(rowNumber, 14)
        .setValue(new Date());
    }
  }
}
function assignPermanentEventIds() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Events');

  if (!sheet) {
    throw new Error('Sheet "Events" not found.');
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  // Find highest existing EVT number
  let highestNumber = 0;

  for (let row = 2; row <= lastRow; row++) {
    const existingId =
      String(sheet.getRange(row, 12).getValue() || '').trim();

    const match = existingId.match(/^EVT-(\d+)$/);

    if (match) {
      highestNumber = Math.max(
        highestNumber,
        Number(match[1])
      );
    }
  }

  // Assign permanent IDs
  for (let row = 2; row <= lastRow; row++) {
    const eventName = sheet.getRange(row, 1).getValue(); // A
    const existingId = sheet.getRange(row, 12).getValue(); // L

    if (eventName && !existingId) {
      highestNumber++;

      const newId =
        'EVT-' +
        String(highestNumber).padStart(4, '0');

      sheet
        .getRange(row, 12)
        .setValue(newId);
    }
  }
}function assignPermanentEventIds() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Events');

  if (!sheet) {
    throw new Error('Sheet "Events" not found.');
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  // Find highest existing EVT number
  let highestNumber = 0;

  for (let row = 2; row <= lastRow; row++) {
    const existingId =
      String(sheet.getRange(row, 12).getValue() || '').trim();

    const match = existingId.match(/^EVT-(\d+)$/);

    if (match) {
      highestNumber = Math.max(
        highestNumber,
        Number(match[1])
      );
    }
  }

  // Assign permanent IDs
  for (let row = 2; row <= lastRow; row++) {
    const eventName = sheet.getRange(row, 1).getValue(); // A
    const existingId = sheet.getRange(row, 12).getValue(); // L

    if (eventName && !existingId) {
      highestNumber++;

      const newId =
        'EVT-' +
        String(highestNumber).padStart(4, '0');

      sheet
        .getRange(row, 12)
        .setValue(newId);
    }
  }
}function assignPermanentEventIds() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Events');

  if (!sheet) {
    throw new Error('Sheet "Events" not found.');
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  // Find highest existing EVT number
  let highestNumber = 0;

  for (let row = 2; row <= lastRow; row++) {
    const existingId =
      String(sheet.getRange(row, 12).getValue() || '').trim();

    const match = existingId.match(/^EVT-(\d+)$/);

    if (match) {
      highestNumber = Math.max(
        highestNumber,
        Number(match[1])
      );
    }
  }

  // Assign permanent IDs
  for (let row = 2; row <= lastRow; row++) {
    const eventName = sheet.getRange(row, 1).getValue(); // A
    const existingId = sheet.getRange(row, 12).getValue(); // L

    if (eventName && !existingId) {
      highestNumber++;

      const newId =
        'EVT-' +
        String(highestNumber).padStart(4, '0');

      sheet
        .getRange(row, 12)
        .setValue(newId);
    }
  }
}
function assignPermanentEventIds() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Events');

  if (!sheet) {
    throw new Error('Sheet "Events" not found.');
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  // Find highest existing EVT number
  let highestNumber = 0;

  for (let row = 2; row <= lastRow; row++) {
    const existingId =
      String(sheet.getRange(row, 12).getValue() || '').trim();

    const match = existingId.match(/^EVT-(\d+)$/);

    if (match) {
      highestNumber = Math.max(
        highestNumber,
        Number(match[1])
      );
    }
  }

  // Assign permanent IDs
  for (let row = 2; row <= lastRow; row++) {
    const eventName = sheet.getRange(row, 1).getValue(); // A
    const existingId = sheet.getRange(row, 12).getValue(); // L

    if (eventName && !existingId) {
      highestNumber++;

      const newId =
        'EVT-' +
        String(highestNumber).padStart(4, '0');

      sheet
        .getRange(row, 12)
        .setValue(newId);
    }
  }
}
function listSheetNames() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ss.getSheets().forEach(sheet => {
    console.log(sheet.getName());
  });
}
function diagnoseSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  console.log('Spreadsheet name: ' + ss.getName());
  console.log('Spreadsheet ID: ' + ss.getId());

  ss.getSheets().forEach(sheet => {
    console.log('Sheet: [' + sheet.getName() + ']');
  });
}
function diagnoseSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  console.log('Spreadsheet name: ' + ss.getName());

  ss.getSheets().forEach(sheet => {
    console.log('Sheet: [' + sheet.getName() + ']');
  });
}
function diagnoseEventAssignments() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Volunteer Tasks');

  if (!sheet) {
    throw new Error('Volunteer Tasks sheet not found.');
  }

  const data = sheet.getDataRange().getValues();

  const targetId = 'EVT-0001';
  let total = 0;
  let countedAsConfirmed = 0;

  for (let i = 1; i < data.length; i++) {
    const rowNumber = i + 1;

    const eventId = String(data[i][5] || '').trim(); // F
    const status = String(data[i][9] || '').trim();  // J

    if (eventId === targetId) {
      total++;

      if (status !== 'Declined' && status !== 'Cancelled') {
        countedAsConfirmed++;
      }

      console.log(
        'Row ' + rowNumber +
        ' | F=' + eventId +
        ' | J=' + status
      );
    }
  }

  console.log('TOTAL EVT-0001 rows = ' + total);
  console.log('CONFIRMED count = ' + countedAsConfirmed);
}
