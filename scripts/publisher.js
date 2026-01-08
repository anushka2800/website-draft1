document.addEventListener("DOMContentLoaded", () => {
  const line = document.querySelector("#chartLine");
  const area = document.querySelector("#chartArea");
  const points = document.querySelectorAll("circle[id^='p']");

  const length = line.getTotalLength();
  line.style.strokeDasharray = length;
  line.style.strokeDashoffset = length;

  anime.timeline({ easing: "easeOutCubic" })

    // 1️⃣ draw line
    .add({
      targets: line,
      strokeDashoffset: [length, 0],
      duration: 2000
    })

    // 2️⃣ fade in area under curve
    .add({
      targets: area,
      opacity: [0, 1],
      duration: 700
    }, "-=1200")

    // 3️⃣ animate dots
    .add({
      targets: points,
      r: [0, 6],
      duration: 400,
      delay: anime.stagger(120)
    }, "-=800");
});
