/*
  Project: Saroj Jawa - Professional Numerologist
  Description: Form Validation + Google Sheets Submission
*/

document.addEventListener('DOMContentLoaded', () => {

  const bookingForm = document.getElementById('bookingForm');

  if (!bookingForm) return;

  // ==========================================
  // GOOGLE APPS SCRIPT WEB APP URL
  // ==========================================
  const GOOGLE_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycby_JJZTSrsUv79InE8pUIl82b4vKXy_HrqnE2nHe6-Qc6WVGqTLuUaxe4FTrSLQS7mB/exec';


  bookingForm.addEventListener('submit', async function(e) {

    e.preventDefault();

    let isValid = true;

    const formData = new FormData(bookingForm);

    // ==========================================
    // RESET PREVIOUS ERRORS
    // ==========================================

    const errorMessages = document.querySelectorAll('.error-message');

    errorMessages.forEach(msg => {
      msg.style.display = 'none';
      msg.textContent = '';
    });

    const inputs = document.querySelectorAll('.form-control');

    inputs.forEach(input => {
      input.classList.remove('error');
    });


    // ==========================================
    // ERROR FUNCTION
    // ==========================================

    const showError = (fieldId, message) => {

      const input = document.getElementById(fieldId);
      const errorDiv = document.getElementById(fieldId + 'Error');

      if (input && errorDiv) {

        input.classList.add('error');

        errorDiv.textContent = message;

        errorDiv.style.display = 'block';
      }

      isValid = false;
    };


    // ==========================================
    // 1. NAME
    // ==========================================

    const name = (formData.get('name') || '').trim();

    if (!name) {
      showError('name', 'Name is required.');
    }


    // ==========================================
    // 2. PHONE
    // ==========================================

    const phone = (formData.get('phone') || '').trim();

    const phoneRegex = /^[0-9\+\-\s]{10,15}$/;

    if (!phone) {

      showError('phone', 'Phone number is required.');

    } else if (!phoneRegex.test(phone)) {

      showError(
        'phone',
        'Please enter a valid phone number (10-15 digits).'
      );

    }


    // ==========================================
    // 3. EMAIL
    // ==========================================

    const email = (formData.get('email') || '').trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {

      showError('email', 'Email is required.');

    } else if (!emailRegex.test(email)) {

      showError(
        'email',
        'Please enter a valid email address.'
      );

    }


    // ==========================================
    // 4. CONSULTATION TYPE
    // ==========================================

    const type = formData.get('type') || '';

    if (!type) {

      showError(
        'type',
        'Please select a consultation type.'
      );

    }


    // ==========================================
    // 5. CONSULTATION MODE
    // ==========================================

    const mode = formData.get('mode') || '';

    if (!mode) {

      showError(
        'mode',
        'Please select a consultation mode.'
      );

    }


    // ==========================================
    // 6. MESSAGE
    // ==========================================

    const message = (formData.get('message') || '').trim();

    if (!message) {

      showError(
        'message',
        'Please share a brief overview of your concern.'
      );

    }


    // ==========================================
    // STOP IF VALIDATION FAILED
    // ==========================================

    if (!isValid) {
      return;
    }


    // ==========================================
    // GET BUTTON
    // ==========================================

    const btn = bookingForm.querySelector(
      'button[type="submit"]'
    );

    const originalButtonText = btn.innerHTML;

    btn.disabled = true;

    btn.innerHTML =
      'Submitting... <span class="loader" style="display:inline-block"></span>';


    // ==========================================
    // PREPARE DATA FOR GOOGLE SHEET
    // ==========================================

    const googleFormData = new URLSearchParams();

    googleFormData.append('name', name);

    googleFormData.append('phone', phone);

    googleFormData.append('email', email);

    googleFormData.append('type', type);

    googleFormData.append('mode', mode);

    googleFormData.append(
      'prefDate',
      (formData.get('prefDate') || '').trim()
    );

    googleFormData.append('message', message);


    // ==========================================
    // SEND DATA TO GOOGLE SHEETS
    // ==========================================

    try {

      await fetch(GOOGLE_SCRIPT_URL, {

        method: 'POST',

        body: googleFormData,

        mode: 'no-cors'

      });


      // ========================================
      // SUCCESS
      // ========================================

      window.location.href = 'thank-you.html';


    } catch (error) {

      console.error(
        'Google Sheets submission error:',
        error
      );


      // Restore button

      btn.disabled = false;

      btn.innerHTML = originalButtonText;


      alert(
        'Something went wrong while submitting your request. Please try again.'
      );

    }

  });

});