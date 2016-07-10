var select = document.getElementById("day");

select.addEventListener("change", function(e) {
  window.location = "?day=" + this.value;
});