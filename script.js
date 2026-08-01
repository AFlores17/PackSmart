document.addEventListener("DOMContentLoaded", function () {
  const backpackForm = document.getElementById("backpackForm");
  const output = document.getElementById("output");
  const backpackSelect = document.getElementById("backpackSelect");

  let backpackDatabase = [];

  // CSV file location
  const csvFilePaths = ["data/backpacks.csv"];

  loadBackpackDatabase();
  loadSavedBackpack();

  // Load backpack data from the CSV file
  async function loadBackpackDatabase() {
    for (const filePath of csvFilePaths) {
      try {
        const response = await fetch(filePath);

        if (!response.ok) {
          continue;
        }

        const csvText = await response.text();
        backpackDatabase = parseCSV(csvText);
        populateBackpackDropdown(backpackDatabase);

        console.log("Loaded backpack database from: " + filePath);
        return;
      } catch (error) {
        console.log("Could not load backpack CSV.");
      }
    }

    backpackSelect.innerHTML = `
      <option value="">CSV not loaded. Enter backpack manually.</option>
      <option value="custom">Add Custom Backpack</option>
    `;
  }

  // Load saved backpack information
  function loadSavedBackpack() {
    const savedBackpack = localStorage.getItem("packsmartBackpack");

    if (savedBackpack) {
      const backpack = JSON.parse(savedBackpack);
      displayBackpack(backpack);
    }
  }

  // CSV parser
  function parseCSV(csvText) {
    const rows = [];
    let currentRow = [];
    let currentValue = "";
    let insideQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"' && insideQuotes && nextChar === '"') {
        currentValue += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        currentRow.push(currentValue.trim());
        currentValue = "";
      } else if ((char === "\n" || char === "\r") && !insideQuotes) {
        if (currentValue || currentRow.length > 0) {
          currentRow.push(currentValue.trim());
          rows.push(currentRow);
          currentRow = [];
          currentValue = "";
        }
      } else {
        currentValue += char;
      }
    }

    if (currentValue || currentRow.length > 0) {
      currentRow.push(currentValue.trim());
      rows.push(currentRow);
    }

    const headers = rows[0];

    return rows.slice(1).map(function (row) {
      const backpack = {};

      headers.forEach(function (header, index) {
        backpack[header] = row[index] || "";
      });

      return backpack;
    });
  }

  // Add backpack options to dropdown
  function populateBackpackDropdown(backpacks) {
    backpackSelect.innerHTML = `
      <option value="">-- Select a backpack or enter your own --</option>
      <option value="custom">Add Custom Backpack</option>
    `;

    backpacks.forEach(function (backpack, index) {
      const option = document.createElement("option");

      option.value = index;
      option.textContent =
        backpack.brand +
        " " +
        backpack.model +
        " - " +
        backpack.capacity_liters +
        "L";

      backpackSelect.appendChild(option);
    });
  }

  // Fill the form when a backpack is selected
  backpackSelect.addEventListener("change", function () {
    const selectedValue = backpackSelect.value;

    if (selectedValue === "" || selectedValue === "custom") {
      clearBackpackForm();
      return;
    }

    const selectedBackpack = backpackDatabase[selectedValue];

    document.getElementById("brand").value = selectedBackpack.brand || "";
    document.getElementById("model").value = selectedBackpack.model || "";
    document.getElementById("capacity").value = selectedBackpack.capacity_liters || "";
    document.getElementById("weightLimit").value = selectedBackpack.load_max_lbs || "";

    output.innerHTML = `
      <div class="saved-item">
        <h3>Selected Backpack From Starter List</h3>
        <p><strong>Brand:</strong> ${selectedBackpack.brand}</p>
        <p><strong>Model:</strong> ${selectedBackpack.model}</p>
        <p><strong>Category:</strong> ${selectedBackpack.category || "Not listed"}</p>
        <p><strong>Capacity:</strong> ${selectedBackpack.capacity_liters || "Not listed"} liters</p>
        <p><strong>Weight Limit:</strong> ${selectedBackpack.load_max_lbs || "Not listed"} lbs</p>
        <p><strong>Pack Weight:</strong> ${selectedBackpack.pack_weight_lbs || "Not listed"} lbs</p>
      </div>

      <p class="status-message">
        Backpack loaded from starter list. Review the fields and save when ready.
      </p>
    `;
  });

  // Save backpack information
  backpackForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const brand = document.getElementById("brand").value.trim();
    const model = document.getElementById("model").value.trim();
    const capacity = document.getElementById("capacity").value.trim();
    const weightLimit = document.getElementById("weightLimit").value.trim();

    if (!brand || !model || !capacity || !weightLimit) {
      output.innerHTML = `
        <p class="status-message">
          Please fill out all backpack information before saving.
        </p>
      `;
      return;
    }

    const backpack = {
      brand: brand,
      model: model,
      capacity: capacity,
      weightLimit: weightLimit
    };

    localStorage.setItem("packsmartBackpack", JSON.stringify(backpack));

    displayBackpack(backpack);

    backpackForm.reset();
    backpackSelect.value = "";
  });

  // Display saved backpack information
  function displayBackpack(backpack) {
    output.innerHTML = `
      <div class="saved-item">
        <h3>Saved Backpack</h3>
        <p><strong>Brand:</strong> ${backpack.brand}</p>
        <p><strong>Model:</strong> ${backpack.model}</p>
        <p><strong>Capacity:</strong> ${backpack.capacity} liters</p>
        <p><strong>Weight Limit:</strong> ${backpack.weightLimit} lbs</p>
      </div>

      <p class="status-message">
        Backpack information saved successfully.
      </p>
    `;
  }

  // Clear backpack form
  function clearBackpackForm() {
    document.getElementById("brand").value = "";
    document.getElementById("model").value = "";
    document.getElementById("capacity").value = "";
    document.getElementById("weightLimit").value = "";
  }

  // Trip Details and Packing List Features

  const tripForm = document.getElementById("tripForm");
  const tripOutput = document.getElementById("tripOutput");
  const packItems = document.querySelectorAll(".pack-item");
  const totalWeightDisplay = document.getElementById("totalWeight");
  const addCustomItemButton = document.getElementById("addCustomItem");
  const customItemsList = document.getElementById("customItemsList");
  const saveFullTripButton = document.getElementById("saveFullTrip");
  const savedTripsOutput = document.getElementById("savedTripsOutput");

  let currentTrip = {};
  let customItems = [];

  loadSavedTripDetails();
  displaySavedTrips();
  updateTotalWeight();

  // Save trip details
  if (tripForm) {
    tripForm.addEventListener("submit", function (event) {
      event.preventDefault();

      currentTrip = {
        name: document.getElementById("tripName").value.trim(),
        location: document.getElementById("tripLocation").value.trim(),
        days: document.getElementById("tripDays").value.trim(),
        weather: document.getElementById("tripWeather").value,
        difficulty: document.getElementById("tripDifficulty").value
      };

      localStorage.setItem("packsmartCurrentTrip", JSON.stringify(currentTrip));

      displayTripDetails(currentTrip);
    });
  }

  // Update total weight when checklist items change
  packItems.forEach(function (item) {
    item.addEventListener("change", updateTotalWeight);
  });

  // Add custom packing item
  if (addCustomItemButton) {
    addCustomItemButton.addEventListener("click", function () {
      const itemName = document.getElementById("customItemName").value.trim();
      const itemWeight = parseFloat(document.getElementById("customItemWeight").value);

      if (!itemName || isNaN(itemWeight)) {
        alert("Please enter an item name and weight.");
        return;
      }

      const newItem = {
        name: itemName,
        weight: itemWeight
      };

      customItems.push(newItem);

      const itemDiv = document.createElement("div");
      itemDiv.className = "custom-item";

      itemDiv.innerHTML = `
        <label>
          <input type="checkbox" class="custom-pack-item" data-weight="${itemWeight}" checked>
          ${itemName} - ${itemWeight} lbs
        </label>
      `;

      customItemsList.appendChild(itemDiv);

      itemDiv
        .querySelector(".custom-pack-item")
        .addEventListener("change", updateTotalWeight);

      document.getElementById("customItemName").value = "";
      document.getElementById("customItemWeight").value = "";

      updateTotalWeight();
    });
  }

  // Calculate total pack weight
  function updateTotalWeight() {
    if (!totalWeightDisplay) {
      return;
    }

    let totalWeight = 0;

    const allItems = document.querySelectorAll(".pack-item, .custom-pack-item");

    allItems.forEach(function (item) {
      if (item.checked) {
        totalWeight += parseFloat(item.dataset.weight);
      }
    });

    totalWeightDisplay.textContent = totalWeight.toFixed(1);
  }

  // Save full trip
  if (saveFullTripButton) {
    saveFullTripButton.addEventListener("click", function () {
      const savedTrips = JSON.parse(localStorage.getItem("packsmartSavedTrips")) || [];

      if (!currentTrip.name) {
        alert("Please save trip details before saving the full trip.");
        return;
      }

      if (savedTrips.length >= 15) {
        alert("You can only save up to 15 trips.");
        return;
      }

      const selectedItems = [];
      const allItems = document.querySelectorAll(".pack-item, .custom-pack-item");

      allItems.forEach(function (item) {
        if (item.checked) {
          selectedItems.push({
            name: item.parentElement.textContent.trim(),
            weight: parseFloat(item.dataset.weight)
          });
        }
      });

      const fullTrip = {
        tripDetails: currentTrip,
        selectedItems: selectedItems,
        totalWeight: totalWeightDisplay.textContent
      };

      savedTrips.push(fullTrip);

      localStorage.setItem("packsmartSavedTrips", JSON.stringify(savedTrips));

      displaySavedTrips();
    });
  }

  // Display trip details
  function displayTripDetails(trip) {
    if (!tripOutput) {
      return;
    }

    tripOutput.innerHTML = `
      <h3>Saved Trip Details</h3>
      <p><strong>Trip:</strong> ${trip.name}</p>
      <p><strong>Location:</strong> ${trip.location}</p>
      <p><strong>Days:</strong> ${trip.days}</p>
      <p><strong>Weather:</strong> ${trip.weather}</p>
      <p><strong>Difficulty:</strong> ${trip.difficulty}</p>
    `;
  }

  // Load saved trip details
  function loadSavedTripDetails() {
    const savedCurrentTrip = localStorage.getItem("packsmartCurrentTrip");

    if (savedCurrentTrip) {
      currentTrip = JSON.parse(savedCurrentTrip);
      displayTripDetails(currentTrip);
    }
  }

  // Display saved trips
  function displaySavedTrips() {
    if (!savedTripsOutput) {
      return;
    }

    const savedTrips = JSON.parse(localStorage.getItem("packsmartSavedTrips")) || [];

    if (savedTrips.length === 0) {
      savedTripsOutput.innerHTML = "<p>No saved trips yet.</p>";
      return;
    }

    let savedOutput = "<h3>Saved Trips</h3>";

    savedTrips.forEach(function (trip, index) {
      savedOutput += `
        <div class="saved-trip">
          <p><strong>${index + 1}. ${trip.tripDetails.name}</strong></p>
          <p>Location: ${trip.tripDetails.location}</p>
          <p>Days: ${trip.tripDetails.days}</p>
          <p>Total Pack Weight: ${trip.totalWeight} lbs</p>
        </div>
      `;
    });

    savedTripsOutput.innerHTML = savedOutput;
  }
});
