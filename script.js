document.addEventListener("DOMContentLoaded", function () {
  const backpackForm = document.getElementById("backpackForm");
  const output = document.getElementById("output");
  const backpackSelect = document.getElementById("backpackSelect");

  const tripForm = document.getElementById("tripForm");
  const tripOutput = document.getElementById("tripOutput");
  const totalWeightDisplay = document.getElementById("totalWeight");
  const backpackLimitDisplay = document.getElementById("backpackLimitDisplay");
  const remainingWeightDisplay = document.getElementById("remainingWeight");
  const weightStatus = document.getElementById("weightStatus");
  const categoryWeightOutput = document.getElementById("categoryWeightOutput");
  const addCustomItemButton = document.getElementById("addCustomItem");
  const customItemsList = document.getElementById("customItemsList");
  const saveFullTripButton = document.getElementById("saveFullTrip");
  const savedTripsOutput = document.getElementById("savedTripsOutput");
  const clearSavedTripsButton = document.getElementById("clearSavedTrips");

  let backpackDatabase = [];
  let currentTrip = {};
  let currentBackpack = getSavedBackpack();

  const csvFilePath = "data/backpacks.csv";

  loadBackpackDatabase();
  loadSavedBackpack();
  loadSavedTripDetails();
  setupPackingItemListeners();
  displaySavedTrips();
  updateTotalWeight();

  async function loadBackpackDatabase() {
    try {
      const response = await fetch(csvFilePath);

      if (!response.ok) {
        throw new Error("CSV file not found");
      }

      const csvText = await response.text();
      backpackDatabase = parseCSV(csvText);
      populateBackpackDropdown(backpackDatabase);
    } catch (error) {
      backpackSelect.innerHTML = `
        <option value="">CSV not loaded. Enter backpack manually.</option>
        <option value="custom">Add Custom Backpack</option>
      `;
    }
  }

  function getSavedBackpack() {
    const savedBackpack = localStorage.getItem("packsmartBackpack");

    if (savedBackpack) {
      return JSON.parse(savedBackpack);
    }

    return {};
  }

  function loadSavedBackpack() {
    if (currentBackpack.brand) {
      displayBackpack(currentBackpack);
    }
  }

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

    currentBackpack = {
      brand: brand,
      model: model,
      capacity: capacity,
      weightLimit: weightLimit
    };

    localStorage.setItem("packsmartBackpack", JSON.stringify(currentBackpack));

    displayBackpack(currentBackpack);
    updateTotalWeight();

    backpackForm.reset();
    backpackSelect.value = "";
  });

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

  function clearBackpackForm() {
    document.getElementById("brand").value = "";
    document.getElementById("model").value = "";
    document.getElementById("capacity").value = "";
    document.getElementById("weightLimit").value = "";
  }

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

  function setupPackingItemListeners() {
    const allItems = document.querySelectorAll(".pack-item, .custom-pack-item");

    allItems.forEach(function (item) {
      item.addEventListener("change", updateTotalWeight);
    });
  }

  if (addCustomItemButton) {
    addCustomItemButton.addEventListener("click", function () {
      const itemName = document.getElementById("customItemName").value.trim();
      const itemWeight = parseFloat(document.getElementById("customItemWeight").value);
      const itemCategory = document.getElementById("customItemCategory").value;
      const itemType = document.getElementById("customItemType").value;

      if (!itemName || isNaN(itemWeight) || itemWeight <= 0) {
        alert("Please enter an item name and a weight greater than 0.");
        return;
      }

      addCustomItemToPage(itemName, itemWeight, itemCategory, itemType);

      document.getElementById("customItemName").value = "";
      document.getElementById("customItemWeight").value = "";

      updateTotalWeight();
    });
  }

  function addCustomItemToPage(itemName, itemWeight, itemCategory, itemType) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "custom-item";

    itemDiv.innerHTML = `
      <label>
        <input
          type="checkbox"
          class="custom-pack-item"
          data-name="${itemName}"
          data-weight="${itemWeight}"
          data-category="${itemCategory}"
          data-type="${itemType}"
          checked
        >
        ${itemName} - ${itemWeight} lbs (${itemType}, ${itemCategory})
      </label>
    `;

    customItemsList.appendChild(itemDiv);
    itemDiv.querySelector(".custom-pack-item").addEventListener("change", updateTotalWeight);
  }

  function getSelectedItems() {
    const selectedItems = [];
    const allItems = document.querySelectorAll(".pack-item, .custom-pack-item");

    allItems.forEach(function (item) {
      if (item.checked) {
        selectedItems.push({
          name: item.dataset.name || item.parentElement.textContent.trim(),
          weight: parseFloat(item.dataset.weight) || 0,
          category: item.dataset.category || "Other",
          type: item.dataset.type || "Optional"
        });
      }
    });

    return selectedItems;
  }

  function updateTotalWeight() {
    if (!totalWeightDisplay) {
      return;
    }

    const selectedItems = getSelectedItems();

    const totalWeight = selectedItems.reduce(function (total, item) {
      return total + item.weight;
    }, 0);

    const categoryTotals = {};
    let requiredTotal = 0;
    let optionalTotal = 0;

    selectedItems.forEach(function (item) {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.weight;

      if (item.type === "Required") {
        requiredTotal += item.weight;
      } else {
        optionalTotal += item.weight;
      }
    });

    totalWeightDisplay.textContent = totalWeight.toFixed(1);
    updateWeightLimitDisplay(totalWeight);
    updateCategorySummary(categoryTotals, requiredTotal, optionalTotal);
  }

  function updateWeightLimitDisplay(totalWeight) {
    const backpackLimit = parseFloat(currentBackpack.weightLimit);

    weightStatus.classList.remove("weight-good", "weight-warning", "weight-over");

    if (!backpackLimit || isNaN(backpackLimit)) {
      backpackLimitDisplay.textContent = "Not saved yet";
      remainingWeightDisplay.textContent = "Save backpack info first";
      weightStatus.textContent =
        "Save backpack information to compare the packing list to the backpack weight limit.";
      weightStatus.classList.add("weight-warning");
      return;
    }

    const remainingWeight = backpackLimit - totalWeight;

    backpackLimitDisplay.textContent = backpackLimit.toFixed(1) + " lbs";
    remainingWeightDisplay.textContent = remainingWeight.toFixed(1) + " lbs";

    if (remainingWeight < 0) {
      weightStatus.textContent =
        "Over the backpack weight limit. Remove some gear or use a larger backpack.";
      weightStatus.classList.add("weight-over");
    } else if (remainingWeight <= 5) {
      weightStatus.textContent = "Close to the weight limit. Optional gear should be reviewed.";
      weightStatus.classList.add("weight-warning");
    } else {
      weightStatus.textContent = "Pack weight is under the backpack weight limit.";
      weightStatus.classList.add("weight-good");
    }
  }

  function updateCategorySummary(categoryTotals, requiredTotal, optionalTotal) {
    let summary = `
      <p><strong>Required Gear:</strong> ${requiredTotal.toFixed(1)} lbs</p>
      <p><strong>Optional Gear:</strong> ${optionalTotal.toFixed(1)} lbs</p>
    `;

    Object.keys(categoryTotals).forEach(function (category) {
      summary += `<p><strong>${category}:</strong> ${categoryTotals[category].toFixed(1)} lbs</p>`;
    });

    categoryWeightOutput.innerHTML = summary;
  }

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

      const selectedItems = getSelectedItems();

      const fullTrip = {
        tripDetails: currentTrip,
        backpack: currentBackpack,
        selectedItems: selectedItems,
        totalWeight: totalWeightDisplay.textContent,
        savedDate: new Date().toLocaleDateString()
      };

      savedTrips.push(fullTrip);
      localStorage.setItem("packsmartSavedTrips", JSON.stringify(savedTrips));

      displaySavedTrips();
    });
  }

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

  function loadSavedTripDetails() {
    const savedCurrentTrip = localStorage.getItem("packsmartCurrentTrip");

    if (savedCurrentTrip) {
      currentTrip = JSON.parse(savedCurrentTrip);
      displayTripDetails(currentTrip);
    }
  }

  function displaySavedTrips() {
    if (!savedTripsOutput) {
      return;
    }

    const savedTrips = JSON.parse(localStorage.getItem("packsmartSavedTrips")) || [];

    if (savedTrips.length === 0) {
      savedTripsOutput.innerHTML = "<p>No saved trips yet.</p>";
      return;
    }

    let savedOutput = `<p><strong>${savedTrips.length} of 15 trips saved.</strong></p>`;

    savedTrips.forEach(function (trip, index) {
      const itemPreview = trip.selectedItems
        .slice(0, 5)
        .map(function (item) {
          return `<li>${item.name} - ${item.weight} lbs (${item.type})</li>`;
        })
        .join("");

      const moreItemsText =
        trip.selectedItems.length > 5
          ? `<p>${trip.selectedItems.length - 5} more item(s) saved.</p>`
          : "";

      const backpackLimit =
        trip.backpack && trip.backpack.weightLimit
          ? trip.backpack.weightLimit + " lbs"
          : "Not saved";

      savedOutput += `
        <div class="saved-trip">
          <p><strong>${index + 1}. ${trip.tripDetails.name}</strong></p>
          <p><strong>Saved:</strong> ${trip.savedDate || "Not listed"}</p>
          <p><strong>Location:</strong> ${trip.tripDetails.location}</p>
          <p><strong>Days:</strong> ${trip.tripDetails.days}</p>
          <p><strong>Total Pack Weight:</strong> ${trip.totalWeight} lbs</p>
          <p><strong>Backpack Limit:</strong> ${backpackLimit}</p>
          <p><strong>Selected Items:</strong></p>
          <ul>${itemPreview}</ul>
          ${moreItemsText}
          <div class="trip-actions">
            <button type="button" class="load-trip" data-index="${index}">Load Trip</button>
            <button type="button" class="delete-trip" data-index="${index}">Delete Trip</button>
          </div>
        </div>
      `;
    });

    savedTripsOutput.innerHTML = savedOutput;
    setupSavedTripButtons();
  }

  function setupSavedTripButtons() {
    const loadButtons = document.querySelectorAll(".load-trip");
    const deleteButtons = document.querySelectorAll(".delete-trip");

    loadButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const index = parseInt(button.dataset.index);
        loadSavedTrip(index);
      });
    });

    deleteButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const index = parseInt(button.dataset.index);
        deleteSavedTrip(index);
      });
    });
  }

  function loadSavedTrip(index) {
    const savedTrips = JSON.parse(localStorage.getItem("packsmartSavedTrips")) || [];
    const trip = savedTrips[index];

    if (!trip) {
      return;
    }

    currentTrip = trip.tripDetails;
    currentBackpack = trip.backpack || currentBackpack;

    localStorage.setItem("packsmartCurrentTrip", JSON.stringify(currentTrip));
    localStorage.setItem("packsmartBackpack", JSON.stringify(currentBackpack));

    fillTripForm(currentTrip);
    fillBackpackForm(currentBackpack);
    displayTripDetails(currentTrip);
    displayBackpack(currentBackpack);
    restoreSelectedItems(trip.selectedItems || []);
    updateTotalWeight();
  }

  function fillTripForm(trip) {
    document.getElementById("tripName").value = trip.name || "";
    document.getElementById("tripLocation").value = trip.location || "";
    document.getElementById("tripDays").value = trip.days || "";
    document.getElementById("tripWeather").value = trip.weather || "";
    document.getElementById("tripDifficulty").value = trip.difficulty || "";
  }

  function fillBackpackForm(backpack) {
    document.getElementById("brand").value = backpack.brand || "";
    document.getElementById("model").value = backpack.model || "";
    document.getElementById("capacity").value = backpack.capacity || "";
    document.getElementById("weightLimit").value = backpack.weightLimit || "";
  }

  function restoreSelectedItems(savedItems) {
    customItemsList.innerHTML = "";

    const allDefaultItems = document.querySelectorAll(".pack-item");

    allDefaultItems.forEach(function (item) {
      item.checked = false;
    });

    savedItems.forEach(function (savedItem) {
      let matchedDefaultItem = null;

      allDefaultItems.forEach(function (defaultItem) {
        if (
          defaultItem.dataset.name === savedItem.name &&
          defaultItem.dataset.category === savedItem.category &&
          defaultItem.dataset.type === savedItem.type
        ) {
          matchedDefaultItem = defaultItem;
        }
      });

      if (matchedDefaultItem) {
        matchedDefaultItem.checked = true;
      } else {
        addCustomItemToPage(
          savedItem.name,
          savedItem.weight,
          savedItem.category || "Extras",
          savedItem.type || "Optional"
        );
      }
    });
  }

  function deleteSavedTrip(index) {
    const savedTrips = JSON.parse(localStorage.getItem("packsmartSavedTrips")) || [];

    savedTrips.splice(index, 1);
    localStorage.setItem("packsmartSavedTrips", JSON.stringify(savedTrips));

    displaySavedTrips();
  }

  if (clearSavedTripsButton) {
    clearSavedTripsButton.addEventListener("click", function () {
      const confirmClear = confirm("Clear all saved trips?");

      if (confirmClear) {
        localStorage.removeItem("packsmartSavedTrips");
        displaySavedTrips();
      }
    });
  }
});
