const backpackForm = document.getElementById("backpackForm");
const output = document.getElementById("output");
const backpackSelect = document.getElementById("backpackSelect");

let backpackDatabase = [];

// Try these CSV locations.
// This helps in case your file is named differently or placed in a data folder.
const csvFilePaths = [
  "backpacks.csv",
  "backpacks.csv.csv",
  "data/backpacks.csv",
  "data/packsmart_backpacks.csv"
];

// Load saved backpack information and CSV data when the page opens
window.addEventListener("load", () => {
  loadBackpackDatabase();

  const savedBackpack = localStorage.getItem("packsmartBackpack");

  if (savedBackpack) {
    const backpack = JSON.parse(savedBackpack);
    displayBackpack(backpack);
  }
});

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

      console.log(`Loaded backpack database from: ${filePath}`);
      return;
    } catch (error) {
      console.log(`Could not load: ${filePath}`);
    }
  }

  backpackSelect.innerHTML = `
    <option value="">CSV not loaded. Enter backpack manually.</option>
    <option value="custom">Add Custom Backpack</option>
  `;
}

// CSV parser that handles commas inside quotation marks
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

  return rows.slice(1).map(row => {
    const backpack = {};

    headers.forEach((header, index) => {
      backpack[header] = row[index] || "";
    });

    return backpack;
  });
}

// Add backpack database options to the dropdown
function populateBackpackDropdown(backpacks) {
  backpackSelect.innerHTML = `
    <option value="">-- Select a backpack or enter your own --</option>
    <option value="custom">Add Custom Backpack</option>
  `;

  backpacks.forEach((backpack, index) => {
    const option = document.createElement("option");

    option.value = index;
    option.textContent = `${backpack.brand} ${backpack.model} - ${backpack.capacity_liters}L`;

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

// Save backpack information when the form is submitted
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

// Clear manual backpack fields
function clearBackpackForm() {
  document.getElementById("brand").value = "";
  document.getElementById("model").value = "";
  document.getElementById("capacity").value = "";
  document.getElementById("weightLimit").value = "";
}