// Précharge l'API home en parallèle du chargement de React
(function () {
  fetch("http://localhost/api/home")
    .then((res) => res.json())
    .then((data) => {
      // Stocke dans sessionStorage
      sessionStorage.setItem("preloaded_home", JSON.stringify(data));
      sessionStorage.setItem("preloaded_home_time", Date.now());
    })
    .catch(() => {});
})();
