document.addEventListener('DOMContentLoaded', function () {
    const passwordInput = document.getElementById('signInPassword');
    const togglePasswordShow = document.getElementById('togglePasswordShow');
    const togglePasswordHide = document.getElementById('togglePasswordHide');
  
    togglePasswordShow.addEventListener('click', function () {
      passwordInput.type = 'text';
      togglePasswordShow.classList.add('hide');
      togglePasswordHide.classList.remove('hide');
    });
  
    togglePasswordHide.addEventListener('click', function () {
      passwordInput.type = 'password';
      togglePasswordShow.classList.remove('hide');
      togglePasswordHide.classList.add('hide');
    });
  });
  