<?php
/**
 * Aces Automotive — contact / booking form handler.
 *
 * Receives the booking + contact forms (POSTed as FormData by js/main.js)
 * and emails them to the business inbox. Works on any standard PHP hosting
 * (no Composer/PHPMailer dependency) using PHP's built-in mail().
 *
 * If your host's mail() is unreliable (common on shared hosting), swap the
 * mail() call below for an SMTP-based sender such as PHPMailer configured
 * with your host's SMTP credentials, or a transactional email API
 * (SendGrid, Postmark, Mailgun, etc). The rest of this script — validation,
 * honeypot check, JSON response — stays the same either way.
 */

header('Content-Type: application/json');

// ---- Config -----------------------------------------------------------
$toEmail   = 'aces_autos@yahoo.com.au';
$fromEmail = 'no-reply@acesautomotive.com.au'; // should match your sending domain
$siteName  = 'Aces Automotive website';

// ---- Basic request checks ----------------------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// Honeypot: bots tend to fill every field, humans never see/fill this one.
if (!empty($_POST['website'])) {
    // Pretend success so bots don't retry, but do nothing.
    echo json_encode(['ok' => true]);
    exit;
}

function clean($value) {
    return trim(strip_tags($value ?? ''));
}

$name    = clean($_POST['name'] ?? '');
$phone   = clean($_POST['phone'] ?? '');
$email   = clean($_POST['email'] ?? '');
$service = clean($_POST['service'] ?? '');
$message = clean($_POST['message'] ?? '');

// ---- Validation ---------------------------------------------------------
$errors = [];
if ($name === '') {
    $errors[] = 'Name is required.';
}
if ($phone === '' && $email === '') {
    $errors[] = 'A phone number or email address is required.';
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => implode(' ', $errors)]);
    exit;
}

// ---- Compose email -------------------------------------------------------
$subject = "New enquiry from $siteName" . ($service ? " — $service" : '');

$body  = "You have a new enquiry from the Aces Automotive website:\n\n";
$body .= "Name:    $name\n";
$body .= "Phone:   " . ($phone ?: '-') . "\n";
$body .= "Email:   " . ($email ?: '-') . "\n";
$body .= "Service: " . ($service ?: '-') . "\n";
$body .= "Message:\n" . ($message ?: '-') . "\n";
$body .= "\n---\nSubmitted: " . date('Y-m-d H:i:s') . "\n";
$body .= "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

$headers   = [];
$headers[] = "From: $siteName <$fromEmail>";
if ($email !== '') {
    $headers[] = "Reply-To: $name <$email>";
}
$headers[] = "Content-Type: text/plain; charset=UTF-8";

$sent = @mail($toEmail, $subject, $body, implode("\r\n", $headers));

if ($sent) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not send the message. Please try again or call us directly.']);
}
