const boardSelect = document.getElementById("board-select");
const boardTrigger = document.getElementById("board-trigger");
const boardTriggerLabel = document.getElementById("board-trigger-label");
const boardMenu = document.getElementById("board-menu");
const boardOptions = document.getElementById("board-options");
const boardSearch = document.getElementById("board-search");
const firmwareVersion = document.getElementById("firmware-version");
const firmwareFamily = document.getElementById("firmware-family");
const buildLabel = document.getElementById("build-label");
const flashPackage = document.getElementById("flash-package");
const hardwareCheck = document.getElementById("hardware-check");
const modeGate = document.getElementById("mode-gate");
const workflowPanels = document.getElementById("workflow-panels");
const advancedTabs = document.getElementById("advanced-tabs");
const advancedTabButtons = Array.from(document.querySelectorAll(".mode-tabs__button"));
const modeSimpleButton = document.getElementById("mode-simple-button");
const modeAdvancedButton = document.getElementById("mode-advanced-button");
const sidebarModeSimpleButton = document.getElementById("sidebar-mode-simple");
const sidebarModeAdvancedButton = document.getElementById("sidebar-mode-advanced");
const flashState = document.getElementById("flash-state");
const flashProgressBar = document.getElementById("flash-progress-bar");
const flashProgressText = document.getElementById("flash-progress-text");
const flashProgressPercent = document.getElementById("flash-progress-percent");
const artifactFullName = document.getElementById("artifact-full-name");
const artifactUpdateName = document.getElementById("artifact-update-name");
const deviceReadState = document.getElementById("device-read-state");
const captureDeviceButton = document.getElementById("capture-device-button");
const downloadBackupButton = document.getElementById("download-backup-button");
const capturedName = document.getElementById("captured-name");
const capturedLat = document.getElementById("captured-lat");
const capturedLon = document.getElementById("captured-lon");
const capturedPrivateKey = document.getElementById("captured-private-key");
const capturedGuestPassword = document.getElementById("captured-guest-password");
const capturedWifiSsid = document.getElementById("captured-wifi-ssid");
const capturedMqttUri = document.getElementById("captured-mqtt-uri");
const capturedMeta = document.getElementById("captured-meta");
const prefillName = document.getElementById("prefill-name");
const prefillLat = document.getElementById("prefill-lat");
const prefillLon = document.getElementById("prefill-lon");
const prefillPrivateKey = document.getElementById("prefill-private-key");
const radioPreset = document.getElementById("radio-preset");
const radioFrequency = document.getElementById("radio-frequency");
const radioBandwidth = document.getElementById("radio-bandwidth");
const radioSf = document.getElementById("radio-sf");
const radioCr = document.getElementById("radio-cr");
const radioCommand = document.getElementById("radio-command");
const serialState = document.getElementById("serial-state");
const settingsState = document.getElementById("settings-state");
const verifyState = document.getElementById("verify-state");
const stateBoard = document.getElementById("state-board");
const stateFlash = document.getElementById("state-flash");
const stateSerial = document.getElementById("state-serial");
const stateMqtt = document.getElementById("state-mqtt");
const logPane = document.getElementById("log-pane");
const commandItems = document.querySelectorAll(".command-list__item");

const summaryFirmware = document.getElementById("summary-firmware");
const summarySerial = document.getElementById("summary-serial");
const summaryConfig = document.getElementById("summary-config");
const summaryMqtt = document.getElementById("summary-mqtt");

const flashButton = document.getElementById("flash-button");
const updateButton = document.getElementById("update-button");
const manifestButton = document.getElementById("manifest-button");
const firmwareBranchSelect = document.getElementById("firmware-branch");
const serialButton = document.getElementById("serial-button") || null;
const navSerialButton = document.getElementById("nav-serial-button");
const navActionButton = document.getElementById("nav-action-button");
const settingsApplyDeviceWifiButton = document.getElementById("settings-apply-device-wifi-button");
const settingsApplyMqttButton = document.getElementById("settings-apply-mqtt-button");
const settingsApplyButton = document.getElementById("settings-apply-button") || null;
const configureButton = document.getElementById("configure-button");
const clearLogButton = document.getElementById("clear-log-button");
const settingsForm = document.getElementById("settings-form");
const commandPreviewPane = document.getElementById("command-preview-pane");
const repeaterNameInput = document.getElementById("repeater-name");
const privateKeyInput = document.getElementById("private-key");
const guestPasswordInput = document.getElementById("guest-password");
const adminPasswordInput = document.getElementById("admin-password");
const deviceLatInput = document.getElementById("device-lat");
const deviceLonInput = document.getElementById("device-lon");
const additionalBrokerCountInput = document.getElementById("additional-broker-count");
const mqttLogicalBrokerPanels = [2, 3].map((index) => document.getElementById(`mqtt-logical-broker-${index}-panel`));
const mqttStatusBrokerSections = [1, 2, 3].map((index) => document.getElementById(`mqtt-status-broker-${index}`));
const mqttStatusBrokerToggles = [1, 2, 3].map((index) => document.getElementById(`mqtt-status-broker-${index}-enabled`));
const mqttStatusBrokerToggleRows = [1, 2, 3].map((index) => document.getElementById(`mqtt-status-toggle-row-${index}`));
const mqttBrokerTopicPreviews = [1, 2, 3, 4, 5, 6].map((index) => document.getElementById(`mqtt-broker-${index}-topic-preview`));
const mqttRetainIndicators = [1, 3, 5].reduce((map, index) => {
  map[index] = document.getElementById(`retain-indicator-${index}`);
  return map;
}, {});
const capOverall = document.getElementById("cap-overall");
const capSummary = document.getElementById("cap-summary");

let firmwareData = window.FIRMWARE_DATA || { boards: [] };
const FIRMWARE_FETCH_VERSION = "20260309-2102";
const UI_MODE_STORAGE_KEY = "meshcore-mqtt-ui-mode";
const UI_MODES = {
  SIMPLE: "simple",
  ADVANCED: "advanced"
};

let flashComplete = false;
let currentFirmwareBranch = "main";
const FIRMWARE_BRANCH_STORAGE_KEY = "meshcore-mqtt-firmware-branch";
const DEV_WARNING_SHOWN_KEY = "meshcore-mqtt-dev-warning-shown";
let serialConnected = false;
let configApplied = false;
let currentBoard = null;
let boardSelectionConfirmed = false;
let serialPort = null;
let serialReader = null;
let serialReadBuffer = "";
let serialTextDecoder = new TextDecoder();
let lineListeners = [];
let serialLoopRunning = false;
let flashingNow = false;
let esptoolModulePromise = null;
let filteredBoards = [];
let serialConnectedAt = 0;
let serialCliReady = false;
let preferredSerialPortInfo = null;
let scheduledSerialDisconnect = null;
let capturedDeviceInfo = null;
let savedStep4Settings = null;
let activeMqttBrokerIds = new Set();
const boardManifestCache = new Map();
const stepPanels = Array.from(document.querySelectorAll(".step-panel"));
const STEP_ORDER = [
  "read-device",
  "choose-board",
  "flash-firmware",
  "device-settings",
  "mqtt-settings",
  "configure-device"
];
let activeStepId = "read-device";
let uiMode = null;

const RADIO_PRESETS = {
  AU_RECOMMENDED: {
    label: "Australia",
    frequency: "915.800",
    bandwidth: "250",
    sf: "10",
    cr: "5"
  },
  AU_VICTORIA: {
    label: "Australia: Victoria",
    frequency: "916.575",
    bandwidth: "62.5",
    sf: "7",
    cr: "8"
  },
  EU_UK_RECOMMENDED: {
    label: "EU/UK (Narrow/Recommended)",
    frequency: "869.618",
    bandwidth: "62.5",
    sf: "8",
    cr: "8"
  },
  EU_UK_LONG_RANGE: {
    label: "EU/UK (Long Range)",
    frequency: "869.525",
    bandwidth: "250",
    sf: "11",
    cr: "5"
  },
  EU_UK_MEDIUM_RANGE: {
    label: "EU/UK (Medium Range)",
    frequency: "869.525",
    bandwidth: "250",
    sf: "10",
    cr: "5"
  },
  CZECH_NARROW: {
    label: "Czech Republic (Narrow)",
    frequency: "869.525",
    bandwidth: "62.5",
    sf: "7",
    cr: "5"
  },
  EU_433_LONG_RANGE: {
    label: "EU 433MHz (Long Range)",
    frequency: "433.650",
    bandwidth: "250",
    sf: "11",
    cr: "5"
  },
  NZ_RECOMMENDED: {
    label: "New Zealand",
    frequency: "917.375",
    bandwidth: "250",
    sf: "11",
    cr: "5"
  },
  NZ_NARROW: {
    label: "New Zealand (Narrow)",
    frequency: "917.375",
    bandwidth: "62.5",
    sf: "7",
    cr: "5"
  },
  PORTUGAL_433: {
    label: "Portugal 433",
    frequency: "433.375",
    bandwidth: "62.5",
    sf: "9",
    cr: "6"
  },
  PORTUGAL_868: {
    label: "Portugal 868",
    frequency: "869.618",
    bandwidth: "62.5",
    sf: "7",
    cr: "6"
  },
  SWITZERLAND: {
    label: "Switzerland",
    frequency: "869.618",
    bandwidth: "62.5",
    sf: "8",
    cr: "8"
  },
  US_CA_RECOMMENDED: {
    label: "USA/Canada (Recommended)",
    frequency: "910.525",
    bandwidth: "62.5",
    sf: "7",
    cr: "5"
  },
  VIETNAM: {
    label: "Vietnam",
    frequency: "920.250",
    bandwidth: "250",
    sf: "11",
    cr: "5"
  }
};

const SENSITIVE_COMMAND_PREFIXES = [
  "set mqtt.wifi.pass ",
  "set prv.key ",
  "set guest.password ",
  "password "
];

const MQTT_MAX_BROKERS = 6;
const LOGICAL_MQTT_BROKER_MAX = 3;

function humanFlashPackage(board) {
  if (!board) return "Unavailable";
  if (board.artifacts && board.artifacts.full && board.artifacts.update) {
    return "full + update";
  }
  return "full";
}

function resolveArtifactUrl(path) {
  return new URL(path, window.location.href).toString();
}

function browserCaptureKey(boardId) {
  return `meshcore-mqtt-device-info:${boardId}`;
}

function browserSettingsKey(boardId) {
  return `meshcore-mqtt-step4-settings:${boardId}`;
}

function normalizeUiMode(value) {
  return value === UI_MODES.ADVANCED ? UI_MODES.ADVANCED : value === UI_MODES.SIMPLE ? UI_MODES.SIMPLE : null;
}

function loadUiMode() {
  try {
    return normalizeUiMode(window.localStorage.getItem(UI_MODE_STORAGE_KEY));
  } catch (error) {
    appendLog(`Browser storage warning: ${error.message}`);
    return null;
  }
}

function saveUiMode(mode) {
  try {
    if (!mode) {
      window.localStorage.removeItem(UI_MODE_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(UI_MODE_STORAGE_KEY, mode);
  } catch (error) {
    appendLog(`Browser storage warning: ${error.message}`);
  }
}

function maskPrivateKeyValue(value) {
  if (!value) return "Not captured";
  if (value.length <= 16) return "********";
  return `${value.slice(0, 8)}...${value.slice(-8)}`;
}

function formatCapturedValue(value) {
  return value ? value : "Not captured";
}

function formatCapturedSecret(value) {
  return value ? "Captured" : "Not captured";
}

function formatCapturedTimestamp(timestamp) {
  if (!timestamp) return "Nothing captured in this browser for this board yet.";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Captured in this browser.";
  }
  return `Captured in this browser at ${date.toLocaleString("en-GB", { hour12: false })}.`;
}

function updateBackupExportAvailability() {
  if (!downloadBackupButton) return;
  downloadBackupButton.disabled = !capturedDeviceInfo && !savedStep4Settings;
}

function sanitizeAdditionalBrokerCount(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(LOGICAL_MQTT_BROKER_MAX - 1, parsed));
}

function brokerFieldName(index, suffix) {
  return `mqttBroker${index}${suffix}`;
}

function logicalBrokerMainSlot(logicalIndex) {
  return ((logicalIndex - 1) * 2) + 1;
}

function logicalBrokerStatusSlot(logicalIndex) {
  return logicalBrokerMainSlot(logicalIndex) + 1;
}

function slotLogicalIndex(slotIndex) {
  return Math.ceil(slotIndex / 2);
}

function isStatusSlot(slotIndex) {
  return slotIndex % 2 === 0;
}

function activeLogicalBrokerCount(formData, mode = uiMode) {
  if (mode === UI_MODES.SIMPLE) {
    return 1;
  }
  return sanitizeAdditionalBrokerCount(formData.get("additionalBrokerCount")) + 1;
}

function statusBrokerToggleFieldId(logicalIndex) {
  return `mqtt-status-broker-${logicalIndex}-enabled`;
}

function isStatusBrokerEnabled(formData, logicalIndex) {
  const rawValue = formData.get(statusBrokerToggleFieldId(logicalIndex));
  return rawValue === "on" || rawValue === "1" || rawValue === "true";
}

function brokerDefaultTopicToggleId(index) {
  return `mqtt-broker-${index}-use-default-topic`;
}

function logicalBrokerRetainStatus(formData, logicalIndex) {
  const mainSlot = logicalBrokerMainSlot(logicalIndex);
  return String(formData.get(brokerFormFieldName(mainSlot, "retainStatus")) || "0").trim();
}

function canEnableCustomBroker(formData, logicalIndex, mode = uiMode) {
  if (mode !== UI_MODES.ADVANCED) {
    return false;
  }
  return logicalBrokerRetainStatus(formData, logicalIndex) !== "1";
}

function brokerFieldBaseName(index) {
  return index === 1 ? "" : `mqttBroker${index}`;
}

function brokerFormFieldName(index, key) {
  if (index === 1) {
    const map = {
      uri: "mqttUri",
      username: "mqttUsername",
      password: "mqttPassword",
      topicRoot: "topicRoot",
      iata: "iata",
      retainStatus: "retainStatus"
    };
    return map[key];
  }
  const base = brokerFieldBaseName(index);
  const map = {
    uri: `${base}Uri`,
    username: `${base}Username`,
    password: `${base}Password`,
    topicRoot: `${base}TopicRoot`,
    iata: `${base}Iata`,
    retainStatus: `${base}RetainStatus`
  };
  return map[key];
}

function getBrokerFieldInput(index, key) {
  return settingsForm?.elements?.namedItem(brokerFormFieldName(index, key));
}

function getBrokerUriInput(index) {
  return getBrokerFieldInput(index, "uri");
}

function getBrokerTopicRootInput(index) {
  return getBrokerFieldInput(index, "topicRoot");
}

function getBrokerDefaultTopicToggle(index) {
  return document.getElementById(brokerDefaultTopicToggleId(index));
}

function currentTopicPublicKey({ allowPlaceholder = true } = {}) {
  const value = String(capturedDeviceInfo?.publicKey || "").trim();
  if (value) {
    return value;
  }
  return allowPlaceholder ? "<PUBLIC_KEY>" : "";
}

function buildDefaultPacketsTopic(iata, publicKey = currentTopicPublicKey()) {
  const resolvedIata = String(iata || "").trim() || "<IATA>";
  const resolvedPublicKey = String(publicKey || "").trim() || "<PUBLIC_KEY>";
  return `meshcore/${resolvedIata}/${resolvedPublicKey}/packets`;
}

function isMeshCoreDefaultTopicRoot(value) {
  const normalized = String(value || "").trim().replace(/\/+$/, "");
  return /^meshcore\/[^/]+\/[^/]+\/packets$/i.test(normalized);
}

function normalizeBrokerRecord(index, broker = {}) {
  return {
    index,
    enabled: Boolean(broker.enabled ?? index === 1),
    uri: String(broker.uri || "").trim(),
    username: String(broker.username || "").trim(),
    password: String(broker.password || ""),
    topicRoot: String(broker.topicRoot || "").trim(),
    iata: String(broker.iata || "").trim(),
    retainStatus: String(broker.retainStatus ?? "0")
  };
}

function readRawBrokerSettings(formData, index, { respectMode = true } = {}) {
  const effectiveMode = respectMode ? uiMode : UI_MODES.ADVANCED;
  if (effectiveMode === UI_MODES.SIMPLE && index > 1) {
    return normalizeBrokerRecord(index, {
      enabled: false,
      uri: formData.get(brokerFormFieldName(index, "uri")),
      username: formData.get(brokerFormFieldName(index, "username")),
      password: formData.get(brokerFormFieldName(index, "password")),
      topicRoot: getBrokerDefaultTopicToggle(index)?.checked
        ? buildDefaultPacketsTopic(formData.get(brokerFormFieldName(index, "iata")))
        : formData.get(brokerFormFieldName(index, "topicRoot")),
      iata: formData.get(brokerFormFieldName(index, "iata")),
      retainStatus: formData.get(brokerFormFieldName(index, "retainStatus"))
    });
  }
  const logicalIndex = slotLogicalIndex(index);
  const logicalBrokerVisible = logicalIndex <= activeLogicalBrokerCount(formData, effectiveMode);
  const enabled = isStatusSlot(index)
    ? logicalBrokerVisible && canEnableCustomBroker(formData, logicalIndex, effectiveMode) && isStatusBrokerEnabled(formData, logicalIndex)
    : logicalBrokerVisible;
  const topicRoot = getBrokerDefaultTopicToggle(index)?.checked
    ? buildDefaultPacketsTopic(formData.get(brokerFormFieldName(index, "iata")))
    : formData.get(brokerFormFieldName(index, "topicRoot"));
  return normalizeBrokerRecord(index, {
    enabled,
    uri: formData.get(brokerFormFieldName(index, "uri")),
    username: formData.get(brokerFormFieldName(index, "username")),
    password: formData.get(brokerFormFieldName(index, "password")),
    topicRoot,
    iata: formData.get(brokerFormFieldName(index, "iata")),
    retainStatus: formData.get(brokerFormFieldName(index, "retainStatus"))
  });
}

function shouldAutoStatusBroker(formData, index, mode = uiMode) {
  if (!isStatusSlot(index)) return false;
  const logicalIndex = slotLogicalIndex(index);
  const logicalBrokerVisible = logicalIndex <= activeLogicalBrokerCount(formData, mode);
  return logicalBrokerVisible && logicalBrokerRetainStatus(formData, logicalIndex) === "1";
}

function buildAutoStatusBroker(formData, index, mode = uiMode) {
  const mainBroker = readRawBrokerSettings(formData, index - 1, { respectMode: mode !== UI_MODES.ADVANCED });
  const statusTopicRoot = deriveStatusTopic(mainBroker.topicRoot);
  return normalizeBrokerRecord(index, {
    enabled: Boolean(mainBroker.enabled && statusTopicRoot),
    uri: mainBroker.uri,
    username: mainBroker.username,
    password: mainBroker.password,
    topicRoot: statusTopicRoot,
    iata: mainBroker.iata,
    retainStatus: "0"
  });
}

function readBrokerSettings(formData, index, { respectMode = true } = {}) {
  const effectiveMode = respectMode ? uiMode : UI_MODES.ADVANCED;
  if (shouldAutoStatusBroker(formData, index, effectiveMode)) {
    return buildAutoStatusBroker(formData, index, effectiveMode);
  }
  return readRawBrokerSettings(formData, index, { respectMode });
}

function readAdditionalBrokerSettings(formData) {
  const brokers = [];
  for (let slot = 2; slot <= MQTT_MAX_BROKERS; slot += 1) {
    brokers.push(readBrokerSettings(formData, slot));
  }
  return brokers;
}

function highestConfiguredAdditionalBrokerIndex(source) {
  if (!source) return 1;
  if (typeof source.additionalBrokerCount !== "undefined") {
    return Math.min(LOGICAL_MQTT_BROKER_MAX, sanitizeAdditionalBrokerCount(source.additionalBrokerCount) + 1);
  }
  if (Array.isArray(source.brokers)) {
    const highest = source.brokers.reduce((max, broker, offset) => {
      const index = broker?.index || offset + 1;
      if (isStatusSlot(index)) {
        return max;
      }
      if (broker?.enabled || broker?.uri || broker?.topicRoot || broker?.iata || broker?.username || broker?.password) {
        return Math.max(max, slotLogicalIndex(index));
      }
      return max;
    }, 1);
    return highest;
  }
  return 1;
}

function setHiddenState(element, hidden) {
  if (!element) return;
  element.hidden = hidden;
  element.style.display = hidden ? "none" : "";
}

function updateAdditionalBrokerVisibility() {
  const count = sanitizeAdditionalBrokerCount(additionalBrokerCountInput?.value || 0);
  const formData = new FormData(settingsForm);
  mqttLogicalBrokerPanels.forEach((panel, offset) => {
    const shouldHide = uiMode !== UI_MODES.ADVANCED || offset >= count;
    setHiddenState(panel, shouldHide);
  });
  mqttStatusBrokerSections.forEach((section, offset) => {
    const logicalIndex = offset + 1;
    const logicalVisible = logicalIndex <= count + 1;
    const customAllowed = uiMode === UI_MODES.ADVANCED && logicalVisible && canEnableCustomBroker(formData, logicalIndex);
    const toggle = mqttStatusBrokerToggles[offset];
    const row = mqttStatusBrokerToggleRows[offset];

    setHiddenState(row, !customAllowed);
    if (toggle) {
      if (!customAllowed) {
        toggle.checked = false;
      }
      toggle.disabled = !customAllowed;
    }
    const customEnabled = Boolean(toggle?.checked);
    setHiddenState(section, !(customAllowed && customEnabled));
  });
}

function buildBrokerStatusTopicPreview(index) {
  const broker = readBrokerSettings(new FormData(settingsForm), index);
  if (uiMode === UI_MODES.SIMPLE && index > 1) {
    return "";
  }
  if (index > 1 && !broker.enabled) {
    return "";
  }
  const topicRoot = broker.topicRoot || "";
  if (!topicRoot) {
    return "";
  }
  if (getBrokerDefaultTopicToggle(index)?.checked) {
    // Always show the template with placeholders, ignore whatever is in the input
    const packetsTopic = `meshcore/{IATA}/{PUBLIC_KEY}/packets`;
    if (String(broker.retainStatus || "0") === "1") {
      return `Default topics: ${packetsTopic}/status and ${packetsTopic}`;
    }
    return `Default topic: ${packetsTopic}`;
  }
  if (String(broker.retainStatus || "0") === "1") {
    const statusTopic = deriveStatusTopic(topicRoot);
    if (statusTopic) {
      return `Custom topics: ${statusTopic} and ${topicRoot}`;
    }
    return `Custom topic root: ${topicRoot} (retain needs a /packets topic)`;
  }
  return `Custom topic root: ${topicRoot}`;
}

function updateBrokerTopicPreviews() {
  mqttBrokerTopicPreviews.forEach((preview, offset) => {
    if (!preview) return;
    const brokerIndex = offset + 1;
    const logicalIndex = slotLogicalIndex(brokerIndex);
    if (isStatusSlot(brokerIndex) && mqttStatusBrokerSections[logicalIndex - 1]?.hidden) {
      preview.textContent = "";
      setHiddenState(preview, true);
      return;
    }
    const text = buildBrokerStatusTopicPreview(brokerIndex);
    preview.textContent = text;
    setHiddenState(preview, !text);
  });
  updateRetainIndicators();
}

function deriveStatusTopic(topicRoot) {
  const normalized = String(topicRoot || "").trim().replace(/\/+$/, "");
  if (!normalized) return "";
  if (!/\/packets$/i.test(normalized)) {
    return "";
  }
  return normalized.replace(/\/packets$/i, "/status");
}

function setRetainIndicatorState(target, text, className) {
  if (!target) return;
  target.textContent = text;
  target.className = `retain-indicator ${className}`;
}

function updateRetainIndicators() {
  [1, 3, 5].forEach((index) => {
    const target = mqttRetainIndicators[index];
    if (!target) return;

    if (uiMode === UI_MODES.SIMPLE && index !== 1) {
      target.textContent = "";
      return;
    }

    const broker = readBrokerSettings(new FormData(settingsForm), index);
    if (String(broker.retainStatus || "0") !== "1") {
      setRetainIndicatorState(target, "Off", "retain-indicator--idle");
      return;
    }

    if (getBrokerDefaultTopicToggle(index)?.checked) {
      setRetainIndicatorState(target, "Possible", "retain-indicator--ok");
      return;
    }

    if (deriveStatusTopic(broker.topicRoot)) {
      setRetainIndicatorState(target, "Possible", "retain-indicator--ok");
      return;
    }

    setRetainIndicatorState(target, "Needs /packets", "retain-indicator--error");
  });
}

function syncBrokerTransportCheckboxesFromUri(index) {
  return;
}

function syncBrokerUriFromTransport(index) {
  return;
}

function syncAllBrokerTransportControlsFromUri() {
  return;
}

function syncAllBrokerUrisFromTransport() {
  return;
}

function syncBrokerTopicMode(index) {
  const topicRootInput = getBrokerTopicRootInput(index);
  const toggle = getBrokerDefaultTopicToggle(index);
  if (!topicRootInput || !toggle) return;

  if (toggle.checked) {
    const currentValue = String(topicRootInput.value || "").trim();
    if (currentValue && !isMeshCoreDefaultTopicRoot(currentValue)) {
      topicRootInput.dataset.customTopicRoot = currentValue;
    }
    const iataInput = getBrokerFieldInput(index, "iata");
    topicRootInput.value = buildDefaultPacketsTopic(iataInput?.value);
    topicRootInput.disabled = true;
    return;
  }

  topicRootInput.disabled = false;
  if (isMeshCoreDefaultTopicRoot(topicRootInput.value) && topicRootInput.dataset.customTopicRoot) {
    topicRootInput.value = topicRootInput.dataset.customTopicRoot;
  }
}

function syncAllBrokerTopicModes() {
  for (let index = 1; index <= MQTT_MAX_BROKERS; index += 1) {
    syncBrokerTopicMode(index);
  }
}

function syncBrokerDefaultTopicToggleFromValue(index) {
  const topicRootInput = getBrokerTopicRootInput(index);
  const toggle = getBrokerDefaultTopicToggle(index);
  if (!topicRootInput || !toggle) return;
  toggle.checked = isMeshCoreDefaultTopicRoot(topicRootInput.value);
  syncBrokerTopicMode(index);
}

function syncAllBrokerDefaultTopicTogglesFromValues() {
  for (let index = 1; index <= MQTT_MAX_BROKERS; index += 1) {
    syncBrokerDefaultTopicToggleFromValue(index);
  }
}

function updateModeButtons() {
  const simpleSelected = uiMode === UI_MODES.SIMPLE;
  const advancedSelected = uiMode === UI_MODES.ADVANCED;
  [modeSimpleButton, sidebarModeSimpleButton].forEach((button) => {
    if (!button) return;
    button.classList.toggle("is-selected", simpleSelected);
    button.setAttribute("aria-pressed", simpleSelected ? "true" : "false");
  });
  [modeAdvancedButton, sidebarModeAdvancedButton].forEach((button) => {
    if (!button) return;
    button.classList.toggle("is-selected", advancedSelected);
    button.setAttribute("aria-pressed", advancedSelected ? "true" : "false");
  });
}

function updateAdvancedTabs() {
  if (!advancedTabs) return;
  const showTabs = Boolean(uiMode);
  advancedTabs.hidden = !showTabs;
  advancedTabButtons.forEach((button) => {
    const isActive = button.dataset.stepTarget === activeStepId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
    button.tabIndex = isActive ? 0 : -1;
  });
}

function updateWorkflowModeUi() {
  document.body.classList.toggle("mode-simple", uiMode === UI_MODES.SIMPLE);
  document.body.classList.toggle("mode-advanced", uiMode === UI_MODES.ADVANCED);
  document.body.classList.toggle("mode-unset", !uiMode);
  if (modeGate) {
    // Show mode gate only when no mode is selected
    modeGate.hidden = !!uiMode;
  }
  if (workflowPanels) {
    workflowPanels.hidden = !uiMode;
  }
  updateModeButtons();
  updateAdvancedTabs();
  updateAdditionalBrokerVisibility();
  updateBrokerTopicPreviews();
}

function setUiMode(mode, { persist = true } = {}) {
  const normalized = normalizeUiMode(mode);
  uiMode = normalized;
  if (persist) {
    saveUiMode(normalized);
  }
  if (uiMode === UI_MODES.SIMPLE) {
    activeStepId = null;
  }
  updateWorkflowModeUi();
  syncActiveStep(uiMode ? recommendedStepId() : null, { force: true });
  buildCommandPreview();
}

function getStepIndex(stepId) {
  const index = STEP_ORDER.indexOf(stepId);
  return index >= 0 ? index : 0;
}

function setActiveStep(stepId) {
  if (uiMode && stepId === null) return;
  if (stepId !== null && !STEP_ORDER.includes(stepId)) return;
  activeStepId = stepId;
  stepPanels.forEach((panel) => {
    const isActive = panel.id === stepId;
    panel.classList.toggle("step-panel--active", isActive);
    panel.classList.toggle("step-panel--collapsed", !isActive);
    const header = panel.querySelector(".panel__header");
    if (header) {
      header.setAttribute("aria-expanded", isActive ? "true" : "false");
    }
  });
  updateAdvancedTabs();
  updateNavActionButton();
}

function recommendedStepId() {
  if (!uiMode) return null;
  if (!capturedDeviceInfo) return "read-device";
  if (!currentBoard || !boardSelectionConfirmed) return "choose-board";
  if (!flashComplete) return "flash-firmware";
  if (!configApplied) {
    return serialConnected ? "mqtt-settings" : "device-settings";
  }
  return "configure-device";
}

function syncActiveStep(preferredStepId = null, { force = false } = {}) {
  if (!uiMode) {
    setActiveStep(null);
    return;
  }
  const nextStepId = preferredStepId || recommendedStepId();
  if (force || !activeStepId || getStepIndex(nextStepId) >= getStepIndex(activeStepId)) {
    setActiveStep(nextStepId);
  }
}

function nearlyEqualDecimal(left, right, epsilon = 0.000001) {
  const leftValue = Number.parseFloat(left);
  const rightValue = Number.parseFloat(right);
  if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue)) {
    return false;
  }
  return Math.abs(leftValue - rightValue) <= epsilon;
}

function normalizeVerifyValue(value) {
  return String(value || "").trim();
}

function parseRadioValue(value) {
  const parts = String(value || "").split(",").map((part) => part.trim());
  return {
    frequency: parts[0] || "",
    bandwidth: parts[1] || "",
    sf: parts[2] || "",
    cr: parts[3] || ""
  };
}

function radioValuesMatch(actual, expected) {
  return (
    nearlyEqualDecimal(actual.frequency, expected.frequency) &&
    nearlyEqualDecimal(actual.bandwidth, expected.bandwidth) &&
    normalizeVerifyValue(actual.sf) === normalizeVerifyValue(expected.sf) &&
    normalizeVerifyValue(actual.cr) === normalizeVerifyValue(expected.cr)
  );
}

function pushUniqueRetryCommand(target, entry) {
  if (!entry) return;
  const command = typeof entry === "string" ? entry : entry.command;
  const exists = target.some((item) => (typeof item === "string" ? item : item.command) === command);
  if (!exists) {
    target.push(entry);
  }
}

function renderCapturedDeviceInfo(info) {
  const nameValue = formatCapturedValue(info?.name || "");
  const latValue = formatCapturedValue(info?.lat || "");
  const lonValue = formatCapturedValue(info?.lon || "");
  const keyValue = info?.privateKey ? maskPrivateKeyValue(info.privateKey) : "Not captured";
  const guestPasswordValue = formatCapturedSecret(info?.guestPassword || "");
  const wifiSsidValue = formatCapturedValue(info?.wifiSsid || "");
  const mqttUris = Array.isArray(info?.brokers)
    ? info.brokers
      .filter((broker) => broker?.uri)
      .map((broker) => `Broker ${broker.index}: ${broker.uri}`)
    : [];
  const mqttUriValue = mqttUris.length > 0
    ? mqttUris.join(" | ")
    : formatCapturedValue(info?.mqttUri || "");

  setText(capturedName, nameValue);
  setText(capturedLat, latValue);
  setText(capturedLon, lonValue);
  setText(capturedPrivateKey, keyValue);
  setText(capturedGuestPassword, guestPasswordValue);
  setText(capturedWifiSsid, wifiSsidValue);
  setText(capturedMqttUri, mqttUriValue);
  setText(prefillName, nameValue);
  setText(prefillLat, latValue);
  setText(prefillLon, lonValue);
  setText(prefillPrivateKey, keyValue);
  setText(capturedMeta, formatCapturedTimestamp(info?.capturedAt || ""));
  updateBackupExportAvailability();
}

function saveCapturedDeviceInfo(boardId, info) {
  try {
    window.localStorage.setItem(browserCaptureKey(boardId), JSON.stringify(info));
  } catch (error) {
    appendLog(`Browser storage warning: ${error.message}`);
  }
}

function loadCapturedDeviceInfo(boardId) {
  try {
    const raw = window.localStorage.getItem(browserCaptureKey(boardId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    appendLog(`Browser storage warning: ${error.message}`);
    return null;
  }
}

function readStep4SettingsFromForm() {
  const formData = new FormData(settingsForm);
  const brokers = Array.from({ length: MQTT_MAX_BROKERS }, (_, offset) => readBrokerSettings(formData, offset + 1, { respectMode: false }));
  return {
    repeaterName: String(formData.get("repeaterName") || ""),
    privateKey: String(formData.get("privateKey") || ""),
    guestPassword: String(formData.get("guestPassword") || ""),
    adminPassword: String(formData.get("adminPassword") || ""),
    deviceLat: String(formData.get("deviceLat") || ""),
    deviceLon: String(formData.get("deviceLon") || ""),
    wifiSsid: String(formData.get("wifiSsid") || ""),
    wifiPassword: String(formData.get("wifiPassword") || ""),
    additionalBrokerCount: sanitizeAdditionalBrokerCount(formData.get("additionalBrokerCount")),
    model: String(formData.get("model") || ""),
    clientVersion: String(formData.get("clientVersion") || ""),
    brokers
  };
}

function saveStep4Settings(boardId, settings) {
  try {
    window.localStorage.setItem(browserSettingsKey(boardId), JSON.stringify(settings));
  } catch (error) {
    appendLog(`Browser storage warning: ${error.message}`);
  }
}

function loadStep4Settings(boardId) {
  try {
    const raw = window.localStorage.getItem(browserSettingsKey(boardId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    appendLog(`Browser storage warning: ${error.message}`);
    return null;
  }
}

function resetSettingsFormForBoard() {
  if (!settingsForm) return;

  settingsForm.reset();

  for (let index = 1; index <= MQTT_MAX_BROKERS; index += 1) {
    const topicRootInput = getBrokerTopicRootInput(index);
    if (topicRootInput?.dataset) {
      delete topicRootInput.dataset.customTopicRoot;
    }
  }

  syncAllBrokerDefaultTopicTogglesFromValues();
  updateAdditionalBrokerVisibility();
  updateBrokerTopicPreviews();
}

function applySavedStep4SettingsToForm(settings) {
  if (!settings) return;

  repeaterNameInput.value = settings.repeaterName || repeaterNameInput.value || "";
  privateKeyInput.value = settings.privateKey || privateKeyInput.value || "";
  guestPasswordInput.value = settings.guestPassword || guestPasswordInput.value || "";
  adminPasswordInput.value = settings.adminPassword || adminPasswordInput.value || "";
  deviceLatInput.value = settings.deviceLat || deviceLatInput.value || "";
  deviceLonInput.value = settings.deviceLon || deviceLonInput.value || "";

  const fieldMap = {
    wifiSsid: "wifiSsid",
    wifiPassword: "wifiPassword",
    model: "model",
    clientVersion: "clientVersion"
  };

  Object.entries(fieldMap).forEach(([key, fieldName]) => {
    const input = settingsForm.elements.namedItem(fieldName);
    if (!input) return;
    if (typeof input.value === "string") {
      input.value = settings[key] || input.value || "";
    }
  });

  if (additionalBrokerCountInput) {
    additionalBrokerCountInput.value = String(sanitizeAdditionalBrokerCount(settings.additionalBrokerCount));
  }

  const brokers = Array.isArray(settings.brokers)
    ? settings.brokers.map((broker, offset) => normalizeBrokerRecord(broker?.index || offset + 1, broker))
    : [normalizeBrokerRecord(1, {
      uri: settings.mqttUri,
      username: settings.mqttUsername,
      password: settings.mqttPassword,
      topicRoot: settings.topicRoot,
      iata: settings.iata,
      retainStatus: settings.retainStatus
    })];

  mqttStatusBrokerToggles.forEach((toggle, offset) => {
    if (!toggle) return;
    const statusSlot = logicalBrokerStatusSlot(offset + 1);
    const broker = brokers.find((item) => item.index === statusSlot);
    toggle.checked = Boolean(broker?.enabled || broker?.uri || broker?.topicRoot || broker?.iata || broker?.username || broker?.password);
  });

  brokers.forEach((broker) => {
    ["uri", "username", "password", "topicRoot", "iata", "retainStatus"].forEach((key) => {
      const input = getBrokerFieldInput(broker.index, key);
      if (!input || typeof input.value !== "string") return;
      input.value = broker[key] || (key === "retainStatus" ? "0" : "");
    });
  });
  syncAllBrokerDefaultTopicTogglesFromValues();
  updateAdditionalBrokerVisibility();
  updateBrokerTopicPreviews();
}

function persistCurrentStep4Settings() {
  if (!currentBoard) return;
  savedStep4Settings = readStep4SettingsFromForm();
  saveStep4Settings(currentBoard.id, savedStep4Settings);
  updateBackupExportAvailability();
}

function applyCapturedDeviceInfoToForm(info) {
  if (!info) return;
  repeaterNameInput.value = info.name || "";
  privateKeyInput.value = info.privateKey || "";
  guestPasswordInput.value = info.guestPassword || "";
  deviceLatInput.value = info.lat || "";
  deviceLonInput.value = info.lon || "";

  const capturedFieldMap = {
    wifiSsid: "wifiSsid",
    wifiPassword: "wifiPassword",
    model: "model",
    clientVersion: "clientVersion"
  };

  Object.entries(capturedFieldMap).forEach(([key, fieldName]) => {
    const input = settingsForm.elements.namedItem(fieldName);
    if (!input) return;
    if (typeof input.value === "string" && info[key]) {
      input.value = info[key];
    }
  });

  if (additionalBrokerCountInput) {
    additionalBrokerCountInput.value = String(Math.max(0, highestConfiguredAdditionalBrokerIndex(info) - 1));
  }

  const brokers = Array.isArray(info.brokers)
    ? info.brokers.map((broker, offset) => normalizeBrokerRecord(broker?.index || offset + 1, broker))
    : [normalizeBrokerRecord(1, {
      uri: info.mqttUri,
      username: info.mqttUsername,
      password: info.mqttPassword,
      topicRoot: info.topicRoot,
      iata: info.iata,
      retainStatus: info.retainStatus
    })];

  mqttStatusBrokerToggles.forEach((toggle, offset) => {
    if (!toggle) return;
    const statusSlot = logicalBrokerStatusSlot(offset + 1);
    const broker = brokers.find((item) => item.index === statusSlot);
    toggle.checked = Boolean(broker?.enabled || broker?.uri || broker?.topicRoot || broker?.iata || broker?.username || broker?.password);
  });

  brokers.forEach((broker) => {
    ["uri", "username", "password", "topicRoot", "iata", "retainStatus"].forEach((key) => {
      const input = getBrokerFieldInput(broker.index, key);
      if (!input || typeof input.value !== "string") return;
      input.value = broker[key] || (key === "retainStatus" ? "0" : "");
    });
  });
  syncAllBrokerDefaultTopicTogglesFromValues();
  updateAdditionalBrokerVisibility();
  updateBrokerTopicPreviews();
}

function buildBackupFileContents() {
  const lines = [];
  const boardLabel = currentBoard?.label || "Unknown board";
  const boardId = currentBoard?.id || "unknown-board";
  const captured = capturedDeviceInfo || null;
  const saved = savedStep4Settings || readStep4SettingsFromForm();

  lines.push(`Board: ${boardLabel}`);
  lines.push(`Board ID: ${boardId}`);
  lines.push(`Exported At: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("[Captured Device Values]");
  if (captured) {
    lines.push(`Captured At: ${captured.capturedAt || ""}`);
    lines.push(`Name: ${captured.name || ""}`);
    lines.push(`Public Key: ${captured.publicKey || ""}`);
    lines.push(`Latitude: ${captured.lat || ""}`);
    lines.push(`Longitude: ${captured.lon || ""}`);
    lines.push(`Private Key: ${captured.privateKey || ""}`);
    lines.push(`Guest Password: ${captured.guestPassword || ""}`);
    lines.push(`Radio: ${captured.radio || ""}`);
    lines.push(`WiFi SSID: ${captured.wifiSsid || ""}`);
    lines.push(`WiFi Password: ${captured.wifiPassword || ""}`);
    lines.push(`MQTT Model: ${captured.model || ""}`);
    lines.push(`MQTT Client Version: ${captured.clientVersion || ""}`);
    lines.push(`Additional Brokers: ${captured.additionalBrokerCount || 0}`);
    const capturedBrokers = Array.isArray(captured.brokers)
      ? captured.brokers
      : [normalizeBrokerRecord(1, {
        uri: captured.mqttUri,
        username: captured.mqttUsername,
        password: captured.mqttPassword,
        topicRoot: captured.topicRoot,
        iata: captured.iata,
        retainStatus: captured.retainStatus
      })];
    capturedBrokers.forEach((broker) => {
      lines.push(`MQTT Broker ${broker.index} Enabled: ${broker.enabled ? "1" : "0"}`);
      lines.push(`MQTT Broker ${broker.index} URI: ${broker.uri || ""}`);
      lines.push(`MQTT Broker ${broker.index} Username: ${broker.username || ""}`);
      lines.push(`MQTT Broker ${broker.index} Password: ${broker.password || ""}`);
      lines.push(`MQTT Broker ${broker.index} Topic Root: ${broker.topicRoot || ""}`);
      lines.push(`MQTT Broker ${broker.index} IATA: ${broker.iata || ""}`);
      lines.push(`MQTT Broker ${broker.index} Retain Status: ${broker.retainStatus || ""}`);
    });
  } else {
    lines.push("No captured device values are stored for this board in this browser.");
  }

  lines.push("");
  lines.push("[Step 4 Values Saved In This Browser]");
  lines.push(`Repeater Name: ${saved?.repeaterName || ""}`);
  lines.push(`Private Key: ${saved?.privateKey || ""}`);
  lines.push(`Guest Password: ${saved?.guestPassword || ""}`);
  lines.push(`Admin Password: ${saved?.adminPassword || ""}`);
  lines.push(`Latitude: ${saved?.deviceLat || ""}`);
  lines.push(`Longitude: ${saved?.deviceLon || ""}`);
  lines.push(`WiFi SSID: ${saved?.wifiSsid || ""}`);
  lines.push(`WiFi Password: ${saved?.wifiPassword || ""}`);
  lines.push(`MQTT Model: ${saved?.model || ""}`);
  lines.push(`MQTT Client Version: ${saved?.clientVersion || ""}`);
  lines.push(`Additional Brokers: ${saved?.additionalBrokerCount || 0}`);
  const savedBrokers = Array.isArray(saved?.brokers)
    ? saved.brokers
    : [normalizeBrokerRecord(1, {
      uri: saved?.mqttUri,
      username: saved?.mqttUsername,
      password: saved?.mqttPassword,
      topicRoot: saved?.topicRoot,
      iata: saved?.iata,
      retainStatus: saved?.retainStatus
    })];
  savedBrokers.forEach((broker) => {
    lines.push(`MQTT Broker ${broker.index} Enabled: ${broker.enabled ? "1" : "0"}`);
    lines.push(`MQTT Broker ${broker.index} URI: ${broker.uri || ""}`);
    lines.push(`MQTT Broker ${broker.index} Username: ${broker.username || ""}`);
    lines.push(`MQTT Broker ${broker.index} Password: ${broker.password || ""}`);
    lines.push(`MQTT Broker ${broker.index} Topic Root: ${broker.topicRoot || ""}`);
    lines.push(`MQTT Broker ${broker.index} IATA: ${broker.iata || ""}`);
    lines.push(`MQTT Broker ${broker.index} Retain Status: ${broker.retainStatus || ""}`);
  });
  lines.push("");
  lines.push("Admin password cannot be read back from MeshCore CLI.");

  return `${lines.join("\n")}\n`;
}

function downloadBackupFile() {
  if (!currentBoard) {
    throw new Error("Choose a board before exporting a backup");
  }
  const blob = new Blob([buildBackupFileContents()], { type: "text/plain;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeBoardId = currentBoard.id.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const timestamp = new Date().toISOString().replace(/[:]/g, "-");
  anchor.href = url;
  anchor.download = `${safeBoardId}-backup-${timestamp}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

function setBoardDetails(board, { userSelected = false } = {}) {
  const sameBoard = currentBoard && board && currentBoard.id === board.id;
  if (userSelected) {
    boardSelectionConfirmed = Boolean(board);
  } else if (!sameBoard) {
    boardSelectionConfirmed = false;
  }
  currentBoard = board;
  if (!board) return;

  boardTriggerLabel.textContent = board.label;
  stateBoard.textContent = board.label;
  firmwareVersion.textContent = board.firmwareVersion;
  firmwareFamily.textContent = board.firmwareName;
  buildLabel.textContent = board.firmwareVersion;
  flashPackage.textContent = humanFlashPackage(board);
  hardwareCheck.textContent = board.hardwareStatus;
  artifactFullName.textContent = board.artifacts.full;
  artifactUpdateName.textContent = board.artifacts.update || board.artifacts.full;
  capturedDeviceInfo = loadCapturedDeviceInfo(board.id);
  savedStep4Settings = loadStep4Settings(board.id);
  resetSettingsFormForBoard();
  renderCapturedDeviceInfo(capturedDeviceInfo);
  if (capturedDeviceInfo) {
    applyCapturedDeviceInfoToForm(capturedDeviceInfo);
    setPanelState(deviceReadState, "Loaded from browser", "panel__status--success");
  } else {
    setPanelState(deviceReadState, "Not read", "panel__status--idle");
  }
  if (savedStep4Settings) {
    applySavedStep4SettingsToForm(savedStep4Settings);
  }
  updateBackupExportAvailability();
  syncActiveStep(capturedDeviceInfo ? "choose-board" : "read-device", { force: true });
  buildCommandPreview();
  updateBrokerTopicPreviews();

  const flashReady = Boolean(board.artifactBase && board.chipFamily);
  flashButton.disabled = !flashReady || flashingNow;
  updateButton.disabled = !flashReady || flashingNow;
  renderBoardOptions();
}

async function loadFirmwareDataForBranch(branch) {
  appendLog(`Loading firmware data for branch: ${branch}...`);

  try {
    // Determine the firmware data URL based on branch
    const isMain = branch === "main";
    const firmwareDataUrl = isMain
      ? "/assets/firmware-data.js"
      : `/assets/firmware-data-${branch}.js`;

    // Fetch the firmware data script
    const response = await fetch(firmwareDataUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${branch} firmware data`);
    }

    // Get the script text and evaluate it
    const scriptText = await response.text();

    // Create a new script element and execute it
    const script = document.createElement("script");
    script.textContent = scriptText;
    document.head.appendChild(script);

    // Update the global FIRMWARE_DATA
    if (window.FIRMWARE_DATA && window.FIRMWARE_DATA.boards) {
      firmwareData = window.FIRMWARE_DATA;
      boardManifestCache.clear();

      // Update version display to show branch
      const branchLabel = isMain ? "" : ` (${branch.toUpperCase()})`;
      firmwareVersion.textContent = `${firmwareData.boards[0]?.firmwareVersion || "Unknown"}${branchLabel}`;
      firmwareFamily.textContent = `${firmwareData.boards[0]?.firmwareName || "meshcore-mqtt"}${branchLabel}`;

      // Repopulate boards with new data
      populateBoards();

      // If a board was selected, refresh its details
      if (currentBoard) {
        const newBoard = firmwareData.boards.find((b) => b.id === currentBoard.id);
        if (newBoard) {
          setBoardDetails(newBoard, { userSelected: true });
        }
      }

      appendLog(`Loaded ${firmwareData.boards.length} board definitions for ${branch} branch.`);
    } else {
      throw new Error("Invalid firmware data format");
    }
  } catch (error) {
    appendLog(`Warning: Could not load ${branch} firmware data: ${error.message}`);
    // Revert to main if dev fails
    if (branch !== "main") {
      firmwareBranchSelect.value = "main";
      currentFirmwareBranch = "main";
      appendLog("Reverted to main firmware branch.");
    }
  }
}

function populateBoards() {
  boardSelect.innerHTML = "";
  filteredBoards = [...firmwareData.boards];

  firmwareData.boards.forEach((board, index) => {
    const option = document.createElement("option");
    option.value = board.id;
    option.textContent = board.label;
    if (index === 0) option.selected = true;
    boardSelect.appendChild(option);
  });

  setBoardDetails(firmwareData.boards[0]);
}

function closeBoardMenu() {
  boardMenu.hidden = true;
  boardTrigger.setAttribute("aria-expanded", "false");
}

function openBoardMenu() {
  boardMenu.hidden = false;
  boardTrigger.setAttribute("aria-expanded", "true");
  boardSearch.focus();
  boardSearch.select();
}

function filterBoards(term) {
  const query = term.trim().toLowerCase();
  filteredBoards = firmwareData.boards.filter((board) =>
    board.label.toLowerCase().includes(query) || board.id.toLowerCase().includes(query)
  );
  renderBoardOptions();
}

function renderBoardOptions() {
  boardOptions.innerHTML = "";

  if (filteredBoards.length === 0) {
    const empty = document.createElement("div");
    empty.className = "board-combobox__empty";
    empty.textContent = "No boards match that filter.";
    boardOptions.appendChild(empty);
    return;
  }

  filteredBoards.forEach((board) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "board-combobox__option";
    if (currentBoard && currentBoard.id === board.id) {
      option.classList.add("is-selected");
    }
    option.textContent = board.label;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", currentBoard && currentBoard.id === board.id ? "true" : "false");
    option.addEventListener("click", () => {
      boardSelect.value = board.id;
      setBoardDetails(board, { userSelected: true });
      appendLog(`Board selected: ${board.label}`);
      // Don't auto-switch tabs - let user navigate manually
      closeBoardMenu();
    });
    boardOptions.appendChild(option);
  });
}

function evaluateCapabilities() {
  const secureContext = window.isSecureContext || location.hostname === "127.0.0.1" || location.hostname === "localhost";
  const webSerialAvailable = "serial" in navigator;
  const compatible = secureContext && webSerialAvailable;

  if (capOverall) {
    capOverall.textContent = compatible ? "Compatible" : "Not compatible";
  }
  if (capSummary) {
    capSummary.textContent = compatible
      ? "This browser can use the MeshCore Web Serial flasher."
      : "This browser needs HTTPS and Web Serial support before flashing will work.";
  }

  if (!secureContext) {
    appendLog("Browser check: flashing needs HTTPS or localhost.");
  }
  if (!webSerialAvailable) {
    appendLog("Browser check: Web Serial API not detected.");
  }
}

function updateSerialButton() {
  const text = serialConnected ? "Connected" : "Connect Serial";
  if (serialButton) serialButton.textContent = text;
  if (navSerialButton) navSerialButton.textContent = text;
}

function updateNavActionButton() {
  if (!navActionButton) return;

  // Only show on MQTT step, applies all settings (device + wifi + mqtt)
  if (activeStepId === "mqtt-settings") {
    navActionButton.textContent = "Apply All Settings";
    navActionButton.hidden = false;
    navActionButton.dataset.action = "all";
  } else {
    navActionButton.hidden = true;
  }
}

function notifyLineListeners(line) {
  const remaining = [];

  lineListeners.forEach((listener) => {
    if (listener.predicate(line)) {
      listener.resolve(line);
      return;
    }
    remaining.push(listener);
  });

  lineListeners = remaining;
}

function clearLineListeners(errorMessage) {
  const remaining = lineListeners;
  lineListeners = [];
  remaining.forEach((listener) => listener.reject(new Error(errorMessage)));
}

function samePortInfo(left, right) {
  if (!left || !right) return false;
  return left.usbVendorId === right.usbVendorId && left.usbProductId === right.usbProductId;
}

async function requestPreferredPort() {
  if (!("serial" in navigator)) {
    throw new Error("Web Serial API is not available in this browser");
  }

  if (preferredSerialPortInfo) {
    const knownPorts = await navigator.serial.getPorts();
    const matchingPort = knownPorts.find((port) => samePortInfo(port.getInfo(), preferredSerialPortInfo));
    if (matchingPort) {
      appendLog("Reusing the previously flashed serial port.");
      return matchingPort;
    }
  }

  const filters = preferredSerialPortInfo ? [preferredSerialPortInfo] : undefined;
  return navigator.serial.requestPort(filters ? { filters } : undefined);
}

function pushSerialLine(line) {
  if (!line.trim()) return;
  appendLog(`[rx] ${line}`);
  registerMqttRuntimeLine(line);
  notifyLineListeners(line);
}

function processSerialChunk(text) {
  serialReadBuffer += text.replace(/\r/g, "\n");
  const parts = serialReadBuffer.split("\n");
  serialReadBuffer = parts.pop() || "";
  parts.forEach((line) => pushSerialLine(line));
}

async function readSerialLoop() {
  if (!serialPort || serialLoopRunning) return;
  serialLoopRunning = true;

  while (serialPort && serialPort.readable) {
    try {
      serialReader = serialPort.readable.getReader();
      for (;;) {
        const { value, done } = await serialReader.read();
        if (done) break;
        if (value) {
          processSerialChunk(serialTextDecoder.decode(value, { stream: true }));
        }
      }
    } catch (error) {
      appendLog(`Serial read error: ${error.message}`);
      break;
    } finally {
      if (serialReader) {
        serialReader.releaseLock();
        serialReader = null;
      }
    }
  }

  serialLoopRunning = false;
}

function waitForLine(predicate, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const listener = {
      predicate,
      resolve: (line) => {
        clearTimeout(timer);
        resolve(line);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      }
    };

    const timer = setTimeout(() => {
      lineListeners = lineListeners.filter((item) => item !== listener);
      reject(new Error("Timed out waiting for device response"));
    }, timeoutMs);

    lineListeners.push(listener);
  });
}

function getRadioValues() {
  return {
    frequency: radioFrequency.value.trim(),
    bandwidth: radioBandwidth.value.trim(),
    sf: radioSf.value.trim(),
    cr: radioCr.value.trim()
  };
}

function buildRadioCommand() {
  const { frequency, bandwidth, sf, cr } = getRadioValues();
  return `set radio ${frequency},${bandwidth},${sf},${cr}`;
}

function syncRadioCommand() {
  radioCommand.textContent = buildRadioCommand();
}

function applyRadioPreset(presetKey) {
  const preset = RADIO_PRESETS[presetKey];
  if (!preset) return;
  radioFrequency.value = preset.frequency;
  radioBandwidth.value = preset.bandwidth;
  radioSf.value = preset.sf;
  radioCr.value = preset.cr;
  syncRadioCommand();
}

function updateRadioPresetFromInputs() {
  const { frequency, bandwidth, sf, cr } = getRadioValues();
  const matched = Object.entries(RADIO_PRESETS).find(([, preset]) =>
    preset.frequency === frequency &&
    preset.bandwidth === bandwidth &&
    preset.sf === sf &&
    preset.cr === cr
  );
  radioPreset.value = matched ? matched[0] : "CUSTOM";
  syncRadioCommand();
}

function buildConfigurationPlan({ validatePrivateKey = true, requireMqtt = true } = {}) {
  const formData = new FormData(settingsForm);
  const repeaterName = String(repeaterNameInput?.value || "").trim() || String(capturedDeviceInfo?.name || "").trim();
  const privateKey = String(privateKeyInput?.value || "").trim();
  const guestPassword = String(guestPasswordInput?.value || "").trim();
  const adminPassword = String(adminPasswordInput?.value || "").trim();
  const latitude = String(deviceLatInput?.value || "").trim() || String(capturedDeviceInfo?.lat || "").trim();
  const longitude = String(deviceLonInput?.value || "").trim() || String(capturedDeviceInfo?.lon || "").trim();
  const sharedModel = String(formData.get("model") || "").trim();
  const sharedClientVersion = String(formData.get("clientVersion") || "").trim();
  const invalidNameChars = repeaterName.match(/[[\]\\:,?*]/g);

  if (repeaterName.length > 31) {
    throw new Error("Repeater name must be 31 characters or fewer");
  }
  if (invalidNameChars) {
    const uniqueChars = [...new Set(invalidNameChars)].join(" ");
    throw new Error(`Repeater name contains unsupported characters: ${uniqueChars}`);
  }

  if (validatePrivateKey && privateKey && !/^[0-9a-fA-F]{128}$/.test(privateKey)) {
    throw new Error("Private key must be exactly 128 hex characters");
  }
  if (guestPassword.length > 15) {
    throw new Error("Guest password must be 15 characters or fewer");
  }
  if (adminPassword.length > 15) {
    throw new Error("Admin password must be 15 characters or fewer");
  }
  if (latitude) {
    const parsedLat = Number.parseFloat(latitude);
    if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      throw new Error("Latitude must be a number between -90 and 90");
    }
  }
  if (longitude) {
    const parsedLon = Number.parseFloat(longitude);
    if (!Number.isFinite(parsedLon) || parsedLon < -180 || parsedLon > 180) {
      throw new Error("Longitude must be a number between -180 and 180");
    }
  }

  const brokers = Array.from({ length: MQTT_MAX_BROKERS }, (_, offset) => readBrokerSettings(formData, offset + 1));
  const currentPublicKey = currentTopicPublicKey({ allowPlaceholder: false });
  const capturedPrivateKey = String(capturedDeviceInfo?.privateKey || "").trim();
  const enabledDefaultTopicBrokers = brokers.filter((broker) => broker.enabled && getBrokerDefaultTopicToggle(broker.index)?.checked);
  if (enabledDefaultTopicBrokers.length > 0 && !currentPublicKey) {
    throw new Error("Read Current Device Info first so the flasher can build the full default MQTT topic path");
  }
  if (enabledDefaultTopicBrokers.length > 0 && privateKey && privateKey !== capturedPrivateKey) {
    throw new Error("Apply the private key first, then read the device info again before using the default MQTT topic path");
  }
  [1, 3, 5].forEach((index) => {
    const broker = brokers[index - 1];
    if (!broker?.enabled || String(broker.retainStatus || "0") !== "1") {
      return;
    }
    if (!deriveStatusTopic(broker.topicRoot)) {
      throw new Error(`Broker ${index} retain status needs a topic root ending in /packets`);
    }
  });
  const enabledBrokers = brokers.filter((broker) => broker.enabled);
  if (requireMqtt && !brokers[0].uri) {
    throw new Error("Primary MQTT URI is required");
  }
  if (requireMqtt) {
    enabledBrokers.forEach((broker) => {
      if (!broker.uri) {
        throw new Error(`Broker ${broker.index} URI is required`);
      }
    });
  }

  const identityCommands = [];
  if (repeaterName) {
    identityCommands.push(`set name ${repeaterName}`);
  }
  if (latitude) {
    identityCommands.push(`set lat ${latitude}`);
  }
  if (longitude) {
    identityCommands.push(`set lon ${longitude}`);
  }
  const keyCommands = [];
  if (privateKey) {
    keyCommands.push(`set prv.key ${privateKey}`);
  }
  const authCommands = [];
  if (guestPassword) {
    authCommands.push({
      command: `set guest.password ${guestPassword}`,
      verifyKey: "guest.password",
      expectedValue: guestPassword
    });
  }
  if (adminPassword) {
    authCommands.push({
      command: `password ${adminPassword}`,
      timeoutMs: 5000,
      replyPredicate: (value) => /password now:/i.test(value)
    });
  }

  return {
    radio: [buildRadioCommand()],
    identity: identityCommands,
    auth: authCommands,
    wifi: [
      {
        command: `set mqtt.wifi.ssid ${formData.get("wifiSsid") || ""}`,
        verifyKey: "mqtt.wifi.ssid",
        expectedValue: String(formData.get("wifiSsid") || "")
      },
      {
        command: `set mqtt.wifi.pass ${formData.get("wifiPassword") || ""}`,
        verifyKey: "mqtt.wifi.pass",
        expectedValue: String(formData.get("wifiPassword") || "")
      }
    ],
    mqtt: [
      ...(sharedModel ? [{
        command: `set mqtt.model ${sharedModel}`,
        verifyKey: "mqtt.model",
        expectedValue: sharedModel
      }] : []),
      ...(sharedClientVersion ? [{
        command: `set mqtt.client.version ${sharedClientVersion}`,
        verifyKey: "mqtt.client.version",
        expectedValue: sharedClientVersion
      }] : []),
      ...brokers.flatMap((broker) => {
        if (!broker.enabled) {
          return [{
            command: `set mqtt.${broker.index}.enabled 0`,
            verifyKey: `mqtt.${broker.index}.enabled`,
            expectedValue: "0"
          }];
        }

        const entries = [];
        entries.push({
          command: `set mqtt.${broker.index}.uri ${broker.uri}`,
          verifyKey: `mqtt.${broker.index}.uri`,
          expectedValue: broker.uri
        });
        entries.push({
          command: `set mqtt.${broker.index}.username ${broker.username}`,
          verifyKey: `mqtt.${broker.index}.username`,
          expectedValue: broker.username
        });
        entries.push({
          command: `set mqtt.${broker.index}.password ${broker.password}`,
          verifyKey: `mqtt.${broker.index}.password`,
          expectedValue: broker.password
        });
        entries.push({
          command: `set mqtt.${broker.index}.topic.root ${broker.topicRoot}`,
          verifyKey: `mqtt.${broker.index}.topic.root`,
          expectedValue: broker.topicRoot
        });
        entries.push({
          command: `set mqtt.${broker.index}.iata ${broker.iata}`,
          verifyKey: `mqtt.${broker.index}.iata`,
          expectedValue: broker.iata
        });
        entries.push({
          command: `set mqtt.${broker.index}.retain.status ${broker.retainStatus}`,
          verifyKey: `mqtt.${broker.index}.retain.status`,
          expectedValue: broker.retainStatus
        });
        entries.push({
          command: `set mqtt.${broker.index}.enabled 1`,
          verifyKey: `mqtt.${broker.index}.enabled`,
          expectedValue: "1"
        });
        return entries;
      })
    ],
    key: keyCommands,
    reboot: ["reboot"],
    metadata: {
      enabledBrokerCount: enabledBrokers.length
    }
  };
}

function maskSensitiveCommand(command) {
  if (/^set mqtt\.\d+\.password\s+/i.test(command)) {
    return command.replace(/^(set mqtt\.\d+\.password\s+).+$/i, "$1********");
  }
  const prefix = SENSITIVE_COMMAND_PREFIXES.find((value) => command.startsWith(value));
  if (!prefix) return command;
  return `${prefix}********`;
}

function commandText(entry) {
  return typeof entry === "string" ? entry : entry.command;
}

function logSerialCommand(command) {
  appendLog(`> ${maskSensitiveCommand(command)}`);
}

function parseMqttConnectedLine(line) {
  const match = line.match(/mqtt\.connected\s*=\s*([^\s,;]+)/i);
  if (!match) return null;

  const value = match[1].replace(/[^\w.-]+$/g, "").toLowerCase();
  if (["true", "1", "yes", "on", "connected"].includes(value)) {
    return true;
  }
  if (["false", "0", "no", "off", "disconnected"].includes(value)) {
    return false;
  }
  return null;
}

async function writeSerialCommand(command) {
  if (!serialPort || !serialPort.writable) {
    throw new Error("Serial port is not connected");
  }

  const writer = serialPort.writable.getWriter();
  try {
    const payload = new TextEncoder().encode(`${command}\r\n`);
    await writer.write(payload);
  } finally {
    writer.releaseLock();
  }
}

function getCommandSettleDelay(command) {
  const trimmed = String(command || "").trim().toLowerCase();
  if (trimmed.startsWith("set prv.key ")) return 1400;
  if (trimmed.startsWith("set radio ")) return 900;
  if (trimmed.startsWith("set name ")) return 800;
  if (trimmed.startsWith("set guest.password ") || trimmed.startsWith("password ")) return 750;
  if (trimmed.startsWith("set lat ") || trimmed.startsWith("set lon ")) return 650;
  if (trimmed.startsWith("set mqtt.")) return 700;
  if (trimmed.startsWith("get ")) return 300;
  if (trimmed === "ver") return 300;
  if (trimmed === "reboot") return 300;
  return 450;
}

async function runCommandExpectReply(command, predicate = (value) => value.includes("->"), timeoutMs = 6000) {
  logSerialCommand(command);
  await writeSerialCommand(command);
  const line = await waitForLine(predicate, timeoutMs);
  appendLog(`[match] ${line}`);
  await delay(getCommandSettleDelay(command));
  return line;
}

async function runCommandExpectOk(command, timeoutMs = 6000) {
  logSerialCommand(command);
  await writeSerialCommand(command);

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const remaining = Math.max(1, deadline - Date.now());
    const line = await waitForLine((value) => value.includes("->"), remaining);
    if (/->\s*OK\b/i.test(line)) {
      appendLog(`[match] ${line}`);
      await delay(getCommandSettleDelay(command));
      return line;
    }
    if (/->\s*(ERR|ERROR|FAIL)\b/i.test(line)) {
      appendLog(`[match] ${line}`);
      throw new Error(line);
    }
    appendLog(`[skip] ${line}`);
  }

  throw new Error("Timed out waiting for OK response");
}

async function resetSerialConsole() {
  if (!serialPort || typeof serialPort.setSignals !== "function") {
    return false;
  }

  appendLog("CLI is silent. Triggering the official serial reset sequence.");
  await serialPort.setSignals({
    dataTerminalReady: false,
    requestToSend: true
  });
  await delay(250);
  await serialPort.setSignals({
    dataTerminalReady: false,
    requestToSend: false
  });
  await delay(1250);
  return true;
}

async function settleSerialOperation(operation, timeoutMs, warningLabel, silent) {
  const result = await Promise.race([
    operation().then(() => ({ status: "ok" })).catch((error) => ({ status: "error", error })),
    delay(timeoutMs).then(() => ({ status: "timeout" }))
  ]);

  if (result.status === "error" && !silent) {
    appendLog(`${warningLabel}: ${result.error.message}`);
  }
  if (result.status === "timeout" && !silent) {
    appendLog(`${warningLabel}: timed out`);
  }
}

function cancelScheduledSerialDisconnect() {
  if (scheduledSerialDisconnect !== null) {
    window.clearTimeout(scheduledSerialDisconnect);
    scheduledSerialDisconnect = null;
  }
}

function scheduleSerialDisconnect(delayMs, message) {
  cancelScheduledSerialDisconnect();
  appendLog(message);
  scheduledSerialDisconnect = window.setTimeout(() => {
    scheduledSerialDisconnect = null;
    disconnectSerialSession({ silent: true }).catch((error) => {
      appendLog(`Serial disconnect warning: ${error.message}`);
    });
  }, delayMs);
}

function finalizeSerialDisconnect({ silent = false } = {}) {
  serialPort = null;
  serialReader = null;
  serialConnected = false;
  serialConnectedAt = 0;
  serialCliReady = false;
  serialReadBuffer = "";
  serialLoopRunning = false;
  clearLineListeners("Serial port closed");
  updateSerialButton();
  setPanelState(serialState, "Serial disconnected", "panel__status--idle");
  setText(stateSerial, "Disconnected");
  setText(summarySerial, "Disconnected");
  setCommandState(0, "is-pending", "Pending");
  if (!silent) {
    appendLog("Serial link closed.");
  }
}

function disconnectSerialSession({ silent = false } = {}) {
  if (!serialPort) return Promise.resolve();
  cancelScheduledSerialDisconnect();

  const portToClose = serialPort;
  const readerToCancel = serialReader;
  finalizeSerialDisconnect({ silent });

  return (async () => {
    if (readerToCancel) {
      await settleSerialOperation(
        () => readerToCancel.cancel(),
        600,
        "Serial reader cancel warning",
        silent
      );
    }
    await settleSerialOperation(
      () => portToClose.close(),
      900,
      "Serial port close warning",
      silent
    );
  })();
}

async function connectSerial() {
  if (!("serial" in navigator)) {
    throw new Error("Web Serial API is not available in this browser");
  }

  if (serialConnected) {
    await disconnectSerialSession();
    return;
  }

  serialPort = await requestPreferredPort();
  await serialPort.open({ baudRate: 115200 });
  cancelScheduledSerialDisconnect();
  serialConnectedAt = Date.now();
  serialConnected = true;
  serialCliReady = false;
  serialReadBuffer = "";
  serialTextDecoder = new TextDecoder();
  readSerialLoop();
  appendLog("Serial link opened at 115200 baud.");
  appendLog("Waiting for device console to settle.");
  await delay(1200);
  updateSerialButton();
  setPanelState(serialState, "Serial connected", "panel__status--connected");
  setText(stateSerial, "Connected");
  setText(summarySerial, "Connected at 115200");
  setCommandState(0, "is-done", "Connected");
  appendLog("Serial console is ready.");
  // Don't auto-switch tabs - let user navigate manually
}

function buildCommandPreview() {
  try {
    const plan = buildConfigurationPlan({ validatePrivateKey: false, requireMqtt: false });
    const commands = [...plan.radio, ...plan.identity, ...plan.auth, ...plan.wifi, ...plan.key, ...plan.mqtt, ...plan.reboot];
    commandPreviewPane.textContent = commands.map((entry) => maskSensitiveCommand(commandText(entry))).join("\n");
  } catch (error) {
    commandPreviewPane.textContent = `Preview unavailable: ${error.message}`;
  }
}

function stamp() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

function appendLog(message) {
  const line = document.createElement("p");
  const timestamp = document.createElement("span");
  timestamp.textContent = stamp();
  line.appendChild(timestamp);
  line.append(document.createTextNode(message));
  logPane.appendChild(line);
  logPane.scrollTop = logPane.scrollHeight;
}

function setText(target, value) {
  if (!target) return;
  target.textContent = value;
}

function resetMqttRuntimeState(stateText = null, summaryText = null) {
  activeMqttBrokerIds = new Set();
  if (stateText !== null) {
    setText(stateMqtt, stateText);
  }
  if (summaryText !== null) {
    setText(summaryMqtt, summaryText);
  }
}

function registerMqttRuntimeLine(line) {
  const heapMatch = line.match(/MQTT reporter:\s+init broker\s+(\d+)\s+heap=(\d+)/i);
  if (!heapMatch) {
    return;
  }

  const brokerId = Number.parseInt(heapMatch[1], 10);
  const heapValue = Number.parseInt(heapMatch[2], 10);
  if (!Number.isFinite(brokerId) || !Number.isFinite(heapValue) || heapValue <= 0) {
    return;
  }

  activeMqttBrokerIds.add(brokerId);
  const activeCount = activeMqttBrokerIds.size;
  setText(stateMqtt, `Active (${activeCount})`);
  setText(summaryMqtt, `Broker heap detected on ${activeCount} broker${activeCount === 1 ? "" : "s"}`);
}

function setPanelState(target, text, variant) {
  if (!target) return;
  target.textContent = text;
  target.className = `panel__status ${variant}`;
}

function setCommandState(index, state, text) {
  const item = commandItems[index];
  if (!item) return;
  item.className = `command-list__item ${state}`;
  item.querySelector("strong").textContent = text;
}

function setFlashProgress(percent, text) {
  flashProgressBar.style.width = `${percent}%`;
  flashProgressPercent.textContent = `${percent}%`;
  flashProgressText.textContent = text;
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function countdownBeforeApply(seconds) {
  for (let remaining = seconds; remaining >= 1; remaining -= 1) {
    appendLog(`Applying settings in ${remaining} second${remaining === 1 ? "" : "s"}...`);
    await delay(1000);
  }
}

async function runCommands(commands) {
  for (const entry of commands) {
    if (typeof entry === "string") {
      await runCommandExpectOk(entry);
      continue;
    }

    if (entry.replyPredicate) {
      await runCommandExpectReply(entry.command, entry.replyPredicate, entry.timeoutMs || 6000);
      continue;
    }

    try {
      await runCommandExpectOk(entry.command, 4500);
    } catch (error) {
      if (!entry.verifyKey || !/Timed out waiting for device response/i.test(error.message)) {
        throw error;
      }

      appendLog(`No immediate reply for ${maskSensitiveCommand(entry.command)}. Verifying saved value.`);
      const { value } = await readSettingValue(entry.verifyKey, 4500);
      if (value === entry.expectedValue) {
        appendLog(`Verified ${entry.verifyKey} via readback.`);
        await delay(getCommandSettleDelay(entry.command));
        continue;
      }
      throw new Error(`${entry.verifyKey} did not match the requested value`);
    }
  }
}

async function ensureSerialCliReady() {
  if (serialCliReady) return;

  appendLog("Checking MeshCore CLI availability.");
  try {
    const line = await runCommandExpectReply("ver", (value) => value.includes("->"), 4000);
    serialCliReady = true;
    appendLog(`MeshCore CLI ready (${line}).`);
    return;
  } catch (error) {
    appendLog("No immediate reply to ver. Waiting 20 seconds before continuing.");
    await delay(20000);
    serialCliReady = true;
  }
}

async function pulseEspReset(transport) {
  if (!transport || typeof transport.setRTS !== "function") {
    return;
  }
  await transport.setRTS(true);
  await delay(100);
  await transport.setRTS(false);
}

async function releaseFlashSession(transport, port) {
  if (transport && typeof transport.disconnect === "function") {
    await settleSerialOperation(
      () => transport.disconnect(),
      1200,
      "Flash disconnect warning",
      false
    );
  }

  if (port && (port.readable || port.writable)) {
    await settleSerialOperation(
      () => port.close(),
      1200,
      "Flash port close warning",
      false
    );
  }

  await delay(150);
}

async function readMqttStatus(timeoutMs = 8000) {
  logSerialCommand("show mqtt");
  await writeSerialCommand("show mqtt");
  const line = await waitForLine((value) => value.toLowerCase().includes("mqtt.connected="), timeoutMs);
  const connected = parseMqttConnectedLine(line);

  if (connected === null) {
    throw new Error(`Unrecognized MQTT status: ${line}`);
  }

  return { connected, line };
}

async function readSettingValue(key, timeoutMs = 6000) {
  const line = await runCommandExpectReply(`get ${key}`, (value) => value.includes("->"), timeoutMs);
  const match = line.match(/->\s*(.+)$/);
  const rawValue = match ? match[1].trim() : "";
  return {
    line,
    value: rawValue.replace(/^>\s*/, "")
  };
}

async function readOptionalSettingValue(key, timeoutMs = 6000) {
  try {
    return await readSettingValue(key, timeoutMs);
  } catch (error) {
    appendLog(`Readback warning for ${key}: ${error.message}`);
    return { line: "", value: "" };
  }
}

function isSerialSignalFailure(error) {
  const message = String(error?.message || error || "");
  return /setSignals/i.test(message) || /control signals/i.test(message);
}

async function connectBootloaderWithFallback({
  ESPLoader,
  HardReset,
  Transport,
  port,
  flashOptions,
  boardLabel
}) {
  let transport = new Transport(port, true);
  let loader = new ESPLoader({
    ...flashOptions,
    transport
  });
  loader.hr = new HardReset(transport);

  try {
    const chip = await loader.main();
    return { chip, loader, transport };
  } catch (error) {
    if (!isSerialSignalFailure(error)) {
      throw error;
    }

    appendLog("Automatic bootloader entry failed because the browser could not toggle serial control lines.");
    appendLog(`Manual bootloader fallback: hold BOOT on ${boardLabel}, tap RESET, keep BOOT held for 2 seconds, then release.`);

    try {
      await releaseFlashSession(transport, null);
    } catch (releaseError) {
      appendLog(`Flash reconnect warning: ${releaseError.message}`);
    }

    await delay(2500);

    transport = new Transport(port, true);
    loader = new ESPLoader({
      ...flashOptions,
      transport
    });
    loader.hr = new HardReset(transport);
    const chip = await loader.main("no_reset");
    return { chip, loader, transport };
  }
}

function buildExpectedVerifyState() {
  const formData = new FormData(settingsForm);
  const brokers = Array.from({ length: MQTT_MAX_BROKERS }, (_, offset) => readBrokerSettings(formData, offset + 1));
  return {
    radio: {
      frequency: normalizeVerifyValue(radioFrequency.value),
      bandwidth: normalizeVerifyValue(radioBandwidth.value),
      sf: normalizeVerifyValue(radioSf.value),
      cr: normalizeVerifyValue(radioCr.value)
    },
    name: normalizeVerifyValue(repeaterNameInput?.value) || normalizeVerifyValue(capturedDeviceInfo?.name),
    lat: normalizeVerifyValue(deviceLatInput?.value) || normalizeVerifyValue(capturedDeviceInfo?.lat),
    lon: normalizeVerifyValue(deviceLonInput?.value) || normalizeVerifyValue(capturedDeviceInfo?.lon),
    privateKey: normalizeVerifyValue(privateKeyInput?.value),
    guestPassword: normalizeVerifyValue(guestPasswordInput?.value),
    wifiSsid: normalizeVerifyValue(formData.get("wifiSsid")),
    wifiPassword: normalizeVerifyValue(formData.get("wifiPassword")),
    model: normalizeVerifyValue(formData.get("model")),
    clientVersion: normalizeVerifyValue(formData.get("clientVersion")),
    brokers: brokers.map((broker) => ({
      index: broker.index,
      enabled: broker.enabled ? "1" : "0",
      uri: normalizeVerifyValue(broker.uri),
      username: normalizeVerifyValue(broker.username),
      password: normalizeVerifyValue(broker.password),
      topicRoot: normalizeVerifyValue(broker.topicRoot),
      iata: normalizeVerifyValue(broker.iata),
      retainStatus: normalizeVerifyValue(broker.retainStatus)
    }))
  };
}

async function verifyDeviceSettings() {
  const result = await collectVerificationResult(buildConfigurationPlan({ validatePrivateKey: false }));
  if (result.failures.length > 0) {
    const error = new Error(result.failures.join("; "));
    error.retryPlan = result.retryPlan;
    throw error;
  }
}

async function collectVerificationResult(plan) {
  const expected = buildExpectedVerifyState();
  const failures = [];
  const retryPlan = {
    radio: [],
    identity: [],
    auth: [],
    wifi: [],
    mqtt: [],
    key: [],
    reconnectOnly: false,
    requiresReboot: false
  };

  const radioResult = await readSettingValue("radio");
  const actualRadio = parseRadioValue(radioResult.value);
  if (!radioValuesMatch(actualRadio, expected.radio)) {
    failures.push(`radio mismatch (device: ${radioResult.value})`);
    pushUniqueRetryCommand(retryPlan.radio, plan.radio[0]);
    retryPlan.requiresReboot = true;
  } else {
    appendLog("Verified radio settings.");
  }

  const checks = [
    { key: "name", expected: expected.name, label: "name", retryEntry: plan.identity.find((entry) => entry.startsWith("set name ")) },
    { key: "lat", expected: expected.lat, label: "latitude", numeric: true, retryEntry: plan.identity.find((entry) => entry.startsWith("set lat ")) },
    { key: "lon", expected: expected.lon, label: "longitude", numeric: true, retryEntry: plan.identity.find((entry) => entry.startsWith("set lon ")) },
    { key: "prv.key", expected: expected.privateKey, label: "private key", sensitive: true, retryEntry: plan.key[0], requiresReboot: true },
    { key: "guest.password", expected: expected.guestPassword, label: "guest password", sensitive: true, retryEntry: plan.auth.find((entry) => entry.verifyKey === "guest.password") },
    { key: "mqtt.wifi.ssid", expected: expected.wifiSsid, label: "WiFi SSID", retryEntry: plan.wifi.find((entry) => entry.verifyKey === "mqtt.wifi.ssid") },
    { key: "mqtt.wifi.pass", expected: expected.wifiPassword, label: "WiFi password", sensitive: true, retryEntry: plan.wifi.find((entry) => entry.verifyKey === "mqtt.wifi.pass") },
    { key: "mqtt.model", expected: expected.model, label: "MQTT model", retryEntry: plan.mqtt.find((entry) => entry.verifyKey === "mqtt.model") },
    { key: "mqtt.client.version", expected: expected.clientVersion, label: "MQTT client version", retryEntry: plan.mqtt.find((entry) => entry.verifyKey === "mqtt.client.version") }
  ];

  for (const check of checks) {
    if (!check.expected) {
      continue;
    }
    const result = await readSettingValue(check.key, 7000);
    const actualValue = normalizeVerifyValue(result.value);
    const matched = check.numeric
      ? nearlyEqualDecimal(actualValue, check.expected)
      : actualValue === normalizeVerifyValue(check.expected);
    if (!matched) {
      failures.push(
        `${check.label} mismatch (device: ${check.sensitive ? "********" : actualValue || "blank"})`
      );
      if (check.key.startsWith("mqtt.")) {
        pushUniqueRetryCommand(retryPlan[check.key.startsWith("mqtt.wifi.") ? "wifi" : "mqtt"], check.retryEntry);
      } else if (check.key === "guest.password") {
        pushUniqueRetryCommand(retryPlan.auth, check.retryEntry);
      } else if (check.key === "prv.key") {
        pushUniqueRetryCommand(retryPlan.key, check.retryEntry);
      } else {
        pushUniqueRetryCommand(retryPlan.identity, check.retryEntry);
      }
      if (check.requiresReboot) {
        retryPlan.requiresReboot = true;
      }
    } else {
      appendLog(`Verified ${check.label}.`);
    }
  }

  for (const broker of expected.brokers) {
    const brokerChecks = [
      { key: `mqtt.${broker.index}.enabled`, expected: broker.enabled, label: `broker ${broker.index} enabled` }
    ];

    if (broker.enabled === "1") {
      brokerChecks.push(
        { key: `mqtt.${broker.index}.uri`, expected: broker.uri, label: `broker ${broker.index} URI` },
        { key: `mqtt.${broker.index}.username`, expected: broker.username, label: `broker ${broker.index} username` },
        { key: `mqtt.${broker.index}.password`, expected: broker.password, label: `broker ${broker.index} password`, sensitive: true },
        { key: `mqtt.${broker.index}.topic.root`, expected: broker.topicRoot, label: `broker ${broker.index} topic root` },
        { key: `mqtt.${broker.index}.iata`, expected: broker.iata, label: `broker ${broker.index} IATA` },
        { key: `mqtt.${broker.index}.retain.status`, expected: broker.retainStatus, label: `broker ${broker.index} retain status` }
      );
    }

    for (const check of brokerChecks) {
      const retryEntry = plan.mqtt.find((entry) => entry.verifyKey === check.key);
      const result = await readSettingValue(check.key, 7000);
      const actualValue = normalizeVerifyValue(result.value);
      if (actualValue !== normalizeVerifyValue(check.expected)) {
        failures.push(
          `${check.label} mismatch (device: ${check.sensitive ? "********" : actualValue || "blank"})`
        );
        pushUniqueRetryCommand(retryPlan.mqtt, retryEntry);
      } else {
        appendLog(`Verified ${check.label}.`);
      }
    }
  }

  const { connected } = await readMqttStatus();
  if (!connected) {
    failures.push("mqtt.connected=false");
    retryPlan.reconnectOnly = true;
  } else {
    appendLog("Verified mqtt.connected=true.");
  }

  return { failures, retryPlan };
}

async function reconnectSerialForRetry() {
  appendLog("Waiting for the device to reboot before verification.");
  await delay(3200);
  await disconnectSerialSession({ silent: true });
  appendLog("Reconnecting serial for verification.");
  await connectSerial();
  await ensureSerialCliReady();
}

async function applyRetryPlan(retryPlan) {
  const retryCommands = [
    ...retryPlan.radio.map(commandText),
    ...retryPlan.identity.map(commandText),
    ...retryPlan.wifi.map(commandText),
    ...retryPlan.mqtt.map(commandText),
    ...retryPlan.key.map(commandText),
    ...(retryPlan.reconnectOnly ? ["mqtt reconnect"] : [])
  ];

  if (retryCommands.length === 0) {
    appendLog("No retryable settings were identified.");
    return false;
  }

  appendLog(`Retrying only unsaved settings: ${retryCommands.map(maskSensitiveCommand).join(", ")}`);

  if (retryPlan.radio.length > 0) {
    await runCommands(retryPlan.radio);
  }
  if (retryPlan.identity.length > 0) {
    await runCommands(retryPlan.identity);
  }
  if (retryPlan.wifi.length > 0) {
    await runCommands(retryPlan.wifi);
  }
  if (retryPlan.key.length > 0) {
    await runCommands(retryPlan.key);
  }
  if (retryPlan.mqtt.length > 0) {
    await runCommands(retryPlan.mqtt);
  }
  if (retryPlan.reconnectOnly) {
    await runCommandExpectOk("mqtt reconnect", 8000);
  }

  return true;
}

async function captureCurrentDeviceInfo() {
  const openedHere = !serialConnected;

  try {
    if (openedHere) {
      appendLog("Opening serial to read the current device info.");
      await connectSerial();
    }

    await ensureSerialCliReady();
    setPanelState(deviceReadState, "Reading", "panel__status--busy");

    const nameResult = await readOptionalSettingValue("name");
    const publicKeyResult = await readOptionalSettingValue("public.key");
    const latResult = await readOptionalSettingValue("lat");
    const lonResult = await readOptionalSettingValue("lon");
    const privateKeyResult = await readOptionalSettingValue("prv.key");
    const guestPasswordResult = await readOptionalSettingValue("guest.password");
    const radioResult = await readOptionalSettingValue("radio");
    const wifiSsidResult = await readOptionalSettingValue("mqtt.wifi.ssid");
    const wifiPasswordResult = await readOptionalSettingValue("mqtt.wifi.pass");
    const modelResult = await readOptionalSettingValue("mqtt.model");
    const clientVersionResult = await readOptionalSettingValue("mqtt.client.version");
    const brokers = [];

    for (let index = 1; index <= MQTT_MAX_BROKERS; index += 1) {
      const enabledResult = await readOptionalSettingValue(`mqtt.${index}.enabled`);
      const uriResult = await readOptionalSettingValue(`mqtt.${index}.uri`);
      const usernameResult = await readOptionalSettingValue(`mqtt.${index}.username`);
      const passwordResult = await readOptionalSettingValue(`mqtt.${index}.password`);
      const topicRootResult = await readOptionalSettingValue(`mqtt.${index}.topic.root`);
      const iataResult = await readOptionalSettingValue(`mqtt.${index}.iata`);
      const retainStatusResult = await readOptionalSettingValue(`mqtt.${index}.retain.status`);
      brokers.push(normalizeBrokerRecord(index, {
        enabled: normalizeVerifyValue(enabledResult.value) === "1",
        uri: uriResult.value,
        username: usernameResult.value,
        password: passwordResult.value,
        topicRoot: topicRootResult.value,
        iata: iataResult.value,
        retainStatus: retainStatusResult.value || "0"
      }));
    }

    if (!brokers[0].uri && !brokers[0].username && !brokers[0].password && !brokers[0].topicRoot && !brokers[0].iata) {
      appendLog("No broker 1 values found in the new MQTT layout. Trying legacy MQTT keys.");
      const legacyUriResult = await readOptionalSettingValue("mqtt.uri");
      const legacyUsernameResult = await readOptionalSettingValue("mqtt.username");
      const legacyPasswordResult = await readOptionalSettingValue("mqtt.password");
      const legacyTopicRootResult = await readOptionalSettingValue("mqtt.topic.root");
      const legacyIataResult = await readOptionalSettingValue("mqtt.iata");
      const legacyRetainStatusResult = await readOptionalSettingValue("mqtt.retain.status");

      brokers[0] = normalizeBrokerRecord(1, {
        enabled: Boolean(
          legacyUriResult.value ||
          legacyUsernameResult.value ||
          legacyPasswordResult.value ||
          legacyTopicRootResult.value ||
          legacyIataResult.value
        ),
        uri: legacyUriResult.value,
        username: legacyUsernameResult.value,
        password: legacyPasswordResult.value,
        topicRoot: legacyTopicRootResult.value,
        iata: legacyIataResult.value,
        retainStatus: legacyRetainStatusResult.value || "0"
      });
    }

    const highestAdditionalBrokerIndex = highestConfiguredAdditionalBrokerIndex({ brokers });

    const info = {
      name: nameResult.value,
      publicKey: publicKeyResult.value,
      lat: latResult.value,
      lon: lonResult.value,
      privateKey: privateKeyResult.value,
      guestPassword: guestPasswordResult.value,
      radio: radioResult.value,
      wifiSsid: wifiSsidResult.value,
      wifiPassword: wifiPasswordResult.value,
      mqttUri: brokers[0]?.uri || "",
      mqttUsername: brokers[0]?.username || "",
      mqttPassword: brokers[0]?.password || "",
      topicRoot: brokers[0]?.topicRoot || "",
      iata: brokers[0]?.iata || "",
      retainStatus: brokers[0]?.retainStatus || "0",
      model: modelResult.value,
      clientVersion: clientVersionResult.value,
      additionalBrokerCount: Math.max(0, highestAdditionalBrokerIndex - 1),
      brokers,
      capturedAt: new Date().toISOString()
    };

    capturedDeviceInfo = info;
    saveCapturedDeviceInfo(currentBoard.id, info);
    renderCapturedDeviceInfo(info);
    applyCapturedDeviceInfoToForm(info);
    persistCurrentStep4Settings();
    buildCommandPreview();
    setPanelState(deviceReadState, "Captured", "panel__status--success");
    appendLog("Captured current device info and stored it in this browser for this board.");
    // Don't auto-switch tabs - let user navigate manually
  } finally {
    if (openedHere) {
      await disconnectSerialSession({ silent: true });
      appendLog("Serial session closed after reading current device info.");
    }
  }
}

async function loadEspTool() {
  if (!esptoolModulePromise) {
    esptoolModulePromise = import("/assets/vendor/esptool-js-bundle.js?v=20260308-1532");
  }
  return esptoolModulePromise;
}

function createFlashTerminal() {
  const logLine = (value) => {
    if (value === undefined || value === null) return;
    const text = String(value).trim();
    if (text) {
      appendLog(`[flash] ${text}`);
    }
  };

  return {
    clean() {},
    clear() {},
    write(value) {
      logLine(value);
    },
    writeLine(value) {
      logLine(value);
    },
    writeln(value) {
      logLine(value);
    },
    writeError(value) {
      logLine(value);
    }
  };
}

async function fetchBinary(path) {
  const url = new URL(resolveArtifactUrl(path), window.location.href);
  url.searchParams.set("v", FIRMWARE_FETCH_VERSION);
  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path} (${response.status})`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function fetchJson(path) {
  const url = new URL(resolveArtifactUrl(path), window.location.href);
  url.searchParams.set("v", FIRMWARE_FETCH_VERSION);
  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path} (${response.status})`);
  }
  return response.json();
}

async function loadBoardManifest(board) {
  if (!board?.manifestPath) return null;
  if (boardManifestCache.has(board.id)) {
    return boardManifestCache.get(board.id);
  }

  const manifest = await fetchJson(board.manifestPath);
  boardManifestCache.set(board.id, manifest);
  return manifest;
}

function parseFlashOffset(offset) {
  if (typeof offset === "number") return offset;
  if (typeof offset !== "string") {
    throw new Error("Invalid flash offset in manifest");
  }

  const trimmed = offset.trim().toLowerCase();
  return trimmed.startsWith("0x") ? Number.parseInt(trimmed, 16) : Number.parseInt(trimmed, 10);
}

async function buildFlashArtifacts(board, kind) {
  const imageName = kind === "update" ? (board.artifacts.update || board.artifacts.full) : board.artifacts.full;
  const imagePath = `${board.artifactBase}${imageName}`;
  const imageData = await fetchBinary(imagePath);
  appendLog(`Fetched ${imageName} (${imageData.byteLength} bytes).`);
  return [
    {
      imageName,
      label: kind,
      address: kind === "update" ? 0x10000 : 0x0,
      data: await blobToBinaryString(new Blob([imageData]))
    }
  ];
}

async function blobToBinaryString(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let result = "";
  for (let index = 0; index < bytes.length; index += 1) {
    result += String.fromCharCode(bytes[index]);
  }
  return result;
}

async function flashFirmware(kind) {
  if (flashingNow) {
    appendLog("Flash already in progress.");
    return;
  }
  if (!currentBoard?.artifactBase || !currentBoard?.chipFamily) {
    appendLog("Firmware artifact is not published for this board yet.");
    return;
  }
  if (!window.isSecureContext && location.hostname !== "127.0.0.1" && location.hostname !== "localhost") {
    throw new Error("Flashing requires HTTPS or localhost");
  }
  if (!("serial" in navigator)) {
    throw new Error("Web Serial API is not available in this browser");
  }

  flashingNow = true;
  let port = null;
  let transport = null;
  let flashArtifacts = [];

  try {
    if (serialConnected) {
      appendLog("Disconnecting the current serial session before flashing.");
      await disconnectSerialSession({ silent: true });
    }
    setFlashProgress(8, "Waiting for serial permission");
    appendLog("Choose the board USB serial port in the browser prompt.");
    port = await navigator.serial.requestPort();
    if (typeof port.getInfo === "function") {
      preferredSerialPortInfo = port.getInfo();
    }
    appendLog("Serial device selected for flashing.");

    flashButton.disabled = true;
    updateButton.disabled = true;
    setPanelState(flashState, "Connecting", "panel__status--busy");
    stateFlash.textContent = kind === "full" ? "Preparing full image" : "Preparing update image";
    setFlashProgress(4, "Loading browser flasher");

    appendLog("Loading browser flasher library.");
    const { ESPLoader, Transport, HardReset } = await loadEspTool();
    setFlashProgress(12, "Preparing flasher");

    setFlashProgress(16, "Connecting to bootloader");
    appendLog("Connecting to bootloader.");
    flashArtifacts = await buildFlashArtifacts(currentBoard, kind);
    appendLog(
      kind === "update"
        ? `Prepared ${flashArtifacts.length} image for update flash.`
        : `Prepared ${flashArtifacts.length} image for full flash.`
    );

    const flashOptions = {
      debugLogging: false,
      terminal: createFlashTerminal(),
      baudrate: 115200,
      romBaudrate: 115200,
      flashSize: "keep",
      flashMode: "keep",
      flashFreq: "keep",
      eraseAll: kind === "full",
      compress: true,
      fileArray: flashArtifacts.map((artifact) => ({
        data: artifact.data,
        address: artifact.address
      })),
      reportProgress(_fileIndex, written, total) {
        const lowerBound = kind === "full" ? 24 : 24;
        const percent = total > 0 ? Math.max(lowerBound, Math.min(98, Math.round((written / total) * 100))) : lowerBound;
        setFlashProgress(percent, `Writing ${kind} image`);
      }
    };

    const connection = await connectBootloaderWithFallback({
      ESPLoader,
      HardReset,
      Transport,
      port,
      flashOptions,
      boardLabel: currentBoard.label
    });
    const { chip, loader } = connection;
    transport = connection.transport;
    appendLog(`Bootloader connected: ${chip || currentBoard.chipFamily}`);
    setFlashProgress(kind === "full" ? 26 : 24, kind === "full" ? "Erasing and writing full image" : "Starting flash");
    appendLog("Reading flash identity.");
    await loader.flashId();
    if (kind === "full") {
      appendLog("Full image selected. Flash erase is enabled.");
    } else {
      appendLog("Update selected. Writing the bootloader, partitions, boot_app0, and app image without a full erase.");
    }
    await loader.writeFlash(flashOptions);
    await delay(100);
    if (typeof loader.after === "function") {
      await loader.after("hard_reset");
      await delay(100);
    }
    await pulseEspReset(transport);

    flashComplete = true;
    configApplied = false;
    setPanelState(flashState, "Flashed", "panel__status--success");
    setFlashProgress(100, "Flash complete");
    setText(stateFlash, kind === "full" ? "Full image flashed" : "Update image flashed");
    setText(summaryFirmware, flashArtifacts.map((artifact) => artifact.imageName).join(", "));
    setText(summaryConfig, "Not sent");
    resetMqttRuntimeState("Awaiting apply", "Awaiting verify");
    setPanelState(settingsState, "Apply radio + MQTT settings", "panel__status--ready");
    setPanelState(serialState, "Reconnect serial", "panel__status--idle");
    setPanelState(verifyState, "Waiting", "panel__status--idle");
    updateSerialButton();
    appendLog(`Flash completed successfully for ${currentBoard.label}. Reconnect serial, then apply the selected device, WiFi, and MQTT settings.`);
    // Don't auto-switch tabs - let user navigate manually
  } finally {
    flashingNow = false;
    flashButton.disabled = !currentBoard?.artifactBase;
    updateButton.disabled = !currentBoard?.artifactBase;
    window.setTimeout(() => {
      releaseFlashSession(transport, port)
        .then(() => {
          appendLog("Flash session released. The page is ready for serial reconnect.");
        })
        .catch((error) => {
          appendLog(`Flash cleanup warning: ${error.message}`);
        });
    }, 1600);
  }
}

boardSelect.addEventListener("change", () => {
  const board = firmwareData.boards.find((item) => item.id === boardSelect.value);
  setBoardDetails(board, { userSelected: true });
  appendLog(`Board selected: ${board ? board.label : boardSelect.value}`);
  // Don't auto-switch tabs - let user navigate manually
});

boardTrigger.addEventListener("click", () => {
  if (boardMenu.hidden) {
    openBoardMenu();
  } else {
    closeBoardMenu();
  }
});

boardSearch.addEventListener("input", () => {
  filterBoards(boardSearch.value);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("#board-combobox")) {
    closeBoardMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeBoardMenu();
  }
});

stepPanels.forEach((panel) => {
  const header = panel.querySelector(".panel__header");
  if (!header) return;
  header.removeAttribute("role");
  header.removeAttribute("tabindex");
});

advancedTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveStep(button.dataset.stepTarget);
  });
});

modeSimpleButton?.addEventListener("click", () => setUiMode(UI_MODES.SIMPLE));
modeAdvancedButton?.addEventListener("click", () => setUiMode(UI_MODES.ADVANCED));
sidebarModeSimpleButton?.addEventListener("click", () => setUiMode(UI_MODES.SIMPLE));
sidebarModeAdvancedButton?.addEventListener("click", () => setUiMode(UI_MODES.ADVANCED));

Array.from(document.querySelectorAll("#settings-form input, #settings-form select, [form='settings-form']")).forEach((input) => {
  input.addEventListener("input", () => {
    syncAllBrokerTopicModes();
    updateAdditionalBrokerVisibility();
    persistCurrentStep4Settings();
    updateBrokerTopicPreviews();
    buildCommandPreview();
  });
});

[1, 2, 3, 4, 5, 6].forEach((index) => {
  const uriInput = getBrokerUriInput(index);
  const topicRootInput = getBrokerTopicRootInput(index);
  const defaultTopicToggle = getBrokerDefaultTopicToggle(index);

  uriInput?.addEventListener("input", () => {
    persistCurrentStep4Settings();
    updateBrokerTopicPreviews();
    buildCommandPreview();
  });

  topicRootInput?.addEventListener("input", () => {
    persistCurrentStep4Settings();
    updateBrokerTopicPreviews();
    buildCommandPreview();
  });

  defaultTopicToggle?.addEventListener("change", () => {
    syncBrokerTopicMode(index);
    persistCurrentStep4Settings();
    updateBrokerTopicPreviews();
    buildCommandPreview();
  });
});

if (additionalBrokerCountInput) {
  additionalBrokerCountInput.addEventListener("input", () => {
    updateAdditionalBrokerVisibility();
  });
  additionalBrokerCountInput.addEventListener("change", () => {
    updateAdditionalBrokerVisibility();
  });
}

mqttStatusBrokerToggles.forEach((toggle) => {
  toggle?.addEventListener("change", () => {
    updateAdditionalBrokerVisibility();
    persistCurrentStep4Settings();
    updateBrokerTopicPreviews();
    buildCommandPreview();
  });
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
});

radioPreset.addEventListener("change", () => {
  if (radioPreset.value !== "CUSTOM") {
    applyRadioPreset(radioPreset.value);
  } else {
    syncRadioCommand();
  }
  buildCommandPreview();
});

[radioFrequency, radioBandwidth, radioSf, radioCr].forEach((input) => {
  input.addEventListener("input", () => {
    updateRadioPresetFromInputs();
    buildCommandPreview();
  });
});

captureDeviceButton.addEventListener("click", async () => {
  if (!currentBoard) {
    appendLog("Choose a board before reading device info.");
    return;
  }

  appendLog("Read Current Device Info clicked.");
  captureDeviceButton.disabled = true;
  try {
    await captureCurrentDeviceInfo();
  } catch (error) {
    setPanelState(deviceReadState, "Read failed", "panel__status--error");
    appendLog(`Read current device info failed: ${error.message}`);
  } finally {
    captureDeviceButton.disabled = false;
  }
});

downloadBackupButton.addEventListener("click", () => {
  try {
    downloadBackupFile();
    appendLog("Downloaded the current board backup as a text file.");
  } catch (error) {
    appendLog(`Backup download failed: ${error.message}`);
  }
});

// Firmware branch selector
firmwareBranchSelect?.addEventListener("change", async () => {
  const branch = firmwareBranchSelect.value;
  currentFirmwareBranch = branch;

  // Save branch preference
  try {
    window.localStorage.setItem(FIRMWARE_BRANCH_STORAGE_KEY, branch);
  } catch (e) {
    // ignore storage errors
  }

  // Show warning for dev branch
  if (branch === "dev") {
    const alreadyWarned = () => {
      try {
        return window.localStorage.getItem(DEV_WARNING_SHOWN_KEY) === "true";
      } catch (e) {
        return false;
      }
    };

    if (!alreadyWarned()) {
      const proceed = window.confirm(
        "WARNING: You are selecting the DEVELOPMENT firmware branch.\n\n" +
        "This is an unstable, experimental build that may contain bugs, " +
        "incomplete features, or breaking changes.\n\n" +
        "DO NOT use this for production devices.\n\n" +
        "Continue?"
      );
      if (!proceed) {
        // Revert to main
        firmwareBranchSelect.value = "main";
        currentFirmwareBranch = "main";
        try {
          window.localStorage.setItem(FIRMWARE_BRANCH_STORAGE_KEY, "main");
        } catch (e) {
          // ignore
        }
        return;
      }
      // Mark that we've shown the warning
      try {
        window.localStorage.setItem(DEV_WARNING_SHOWN_KEY, "true");
      } catch (e) {
        // ignore
      }
    }
  }

  appendLog(`Firmware branch changed to: ${branch}`);
  // Reload firmware data for the selected branch
  await loadFirmwareDataForBranch(branch);
});

flashButton.addEventListener("click", async () => {
  appendLog("Flash Full Firmware clicked.");
  const confirmed = window.confirm(
    "Flash Full Firmware will erase the device flash before writing the image.\n\nThis can wipe saved settings and should only be used for first install or recovery.\n\nContinue?"
  );
  if (!confirmed) {
    appendLog("Full firmware flash canceled by user.");
    return;
  }
  try {
    await flashFirmware("full");
  } catch (error) {
    setPanelState(flashState, "Flash failed", "panel__status--error");
    stateFlash.textContent = "Flash failed";
    setFlashProgress(0, "Flash failed");
    appendLog(`Full firmware flash failed: ${error.message}`);
  }
});

updateButton.addEventListener("click", async () => {
  appendLog("Flash Update Only clicked.");
  try {
    await flashFirmware("update");
  } catch (error) {
    setPanelState(flashState, "Flash failed", "panel__status--error");
    stateFlash.textContent = "Flash failed";
    setFlashProgress(0, "Flash failed");
    appendLog(`Update firmware flash failed: ${error.message}`);
  }
});

manifestButton.addEventListener("click", () => {
  if (currentBoard && currentBoard.manifestPath) {
    appendLog(`Manifest path: ${currentBoard.manifestPath}`);
    window.open(currentBoard.manifestPath, "_blank", "noopener");
    return;
  }
  appendLog("Manifest is not published for this board yet.");
});

serialButton?.addEventListener("click", async () => {
  try {
    await connectSerial();
  } catch (error) {
    setPanelState(serialState, "Serial error", "panel__status--error");
    appendLog(`Serial error: ${error.message}`);
  }
});

navSerialButton?.addEventListener("click", async () => {
  try {
    await connectSerial();
  } catch (error) {
    setPanelState(serialState, "Serial error", "panel__status--error");
    appendLog(`Serial error: ${error.message}`);
  }
});

navActionButton?.addEventListener("click", async () => {
  const action = navActionButton?.dataset?.action;
  if (!action) return;

  if (action === "flash") {
    const flashButton = document.getElementById("flash-button");
    flashButton?.click();
  } else if (action === "device-wifi") {
    const applyButton = document.getElementById("settings-apply-device-wifi-button");
    if (applyButton) {
      applyButton.click();
    } else {
      await applySettings("device-wifi");
    }
  } else if (action === "mqtt") {
    const applyButton = document.getElementById("settings-apply-mqtt-button");
    if (applyButton) {
      applyButton.click();
    } else {
      await applySettings("mqtt");
    }
  }
});

function markApplyStages(mode) {
  if (mode === "mqtt") {
    setCommandState(1, "is-done", "Skipped");
    setCommandState(2, "is-done", "Skipped");
    setCommandState(3, "is-done", "Skipped");
    setCommandState(4, "is-running", "Running");
    setCommandState(5, "is-done", "Not needed");
    return;
  }

  setCommandState(1, "is-running", "Running");
  setCommandState(2, "is-pending", "Pending");
  setCommandState(3, "is-pending", "Pending");
  setCommandState(4, mode === "device-wifi" ? "is-done" : "is-pending", mode === "device-wifi" ? "Skipped" : "Pending");
  setCommandState(5, "is-pending", "Pending");
}

function markApplyFailure() {
  if (commandItems[1].classList.contains("is-running")) {
    setCommandState(1, "is-failed", "Failed");
  } else if (commandItems[2].classList.contains("is-running")) {
    setCommandState(2, "is-failed", "Failed");
  } else if (commandItems[3].classList.contains("is-running")) {
    setCommandState(3, "is-failed", "Failed");
  } else if (commandItems[4].classList.contains("is-running")) {
    setCommandState(4, "is-failed", "Failed");
  } else if (commandItems[5].classList.contains("is-running")) {
    setCommandState(5, "is-failed", "Failed");
  }
}

async function applySettings(mode = "all") {
  const label = mode === "device-wifi"
    ? "Apply Device + WiFi clicked."
    : mode === "mqtt"
      ? "Apply MQTT clicked."
      : "Apply All Settings clicked.";
  appendLog(label);
  if (!serialConnected) {
    setPanelState(serialState, "Serial required", "panel__status--error");
    appendLog("Cannot configure device until the serial link is connected.");
    return;
  }

  if (!flashComplete) {
    appendLog("Proceeding with configuration without a flash in this session.");
  }

  setPanelState(settingsState, "Writing", "panel__status--busy");
  markApplyStages(mode);
  resetMqttRuntimeState(mode === "mqtt" ? "Applying" : "Rebooting", mode === "mqtt" ? "Awaiting runtime state" : "Reconnect serial to verify");

  try {
    window.alert(
      "Make sure the device is turned on and the serial connection is stable.\n\n" +
      "If needed, press the reset button on the board before continuing.\n\n" +
      "Keep the board plugged in and avoid disconnecting it while settings are being applied."
    );

    const plan = buildConfigurationPlan({ requireMqtt: mode !== "device-wifi" });
    appendLog(mode === "all" ? "Applying all settings immediately." : mode === "device-wifi" ? "Applying device, radio, and WiFi settings." : "Applying MQTT settings only.");
    // Don't auto-switch tabs - let user navigate manually

    if (Date.now() - serialConnectedAt < 2500) {
      appendLog("Allowing a short startup delay before sending the first CLI command.");
      await delay(800);
    }

    await ensureSerialCliReady();
    if (mode !== "mqtt") {
      appendLog(mode === "all"
        ? "Applying device, radio, WiFi, and key settings first. MQTT will be written after."
        : "Applying device, radio, WiFi, and key settings.");
      await runCommandExpectOk(plan.radio[0], 10000);
      setCommandState(1, "is-done", "Written");
      setCommandState(2, "is-running", "Running");

      if (plan.identity.length > 0) {
        await runCommands(plan.identity);
        setCommandState(2, "is-done", "Written");
      } else {
        setCommandState(2, "is-done", "Skipped");
      }

      if (plan.auth.length > 0) {
        await runCommands(plan.auth);
      }
      setCommandState(3, "is-running", "Running");
      await runCommands(plan.wifi);
      if (plan.key.length > 0) {
        await runCommands(plan.key);
      }
      setCommandState(3, "is-done", "Written");

      if (mode === "all") {
        setCommandState(4, "is-running", "Running");
        await runCommands(plan.mqtt);
        setCommandState(4, "is-done", "Written");
      }

      setCommandState(5, "is-running", "Rebooting");
      logSerialCommand(plan.reboot[0]);
      await writeSerialCommand(plan.reboot[0]);
      setCommandState(5, "is-done", "Rebooted");
      setPanelState(settingsState, "Saved, rebooted", "panel__status--success");
      setText(summaryConfig, mode === "all" ? "All commands applied, rebooted" : "Device + WiFi applied, rebooted");
      resetMqttRuntimeState("Rebooting", "Reconnect serial to verify");
      setPanelState(verifyState, "Reconnect serial after reboot", "panel__status--idle");
      if (mode === "all") {
        configApplied = true;
      }
      scheduleSerialDisconnect(2200, mode === "all"
        ? "Device configuration completed. Waiting for the reboot, then closing the serial session."
        : "Device and WiFi configuration completed. Waiting for the reboot, then closing the serial session.");
      return;
    }

    if (mode !== "device-wifi") {
      await runCommands(plan.mqtt);
      setCommandState(4, "is-done", "Written");
      setPanelState(settingsState, "MQTT saved", "panel__status--success");
      setText(summaryConfig, "MQTT commands applied");
      setPanelState(verifyState, "Ready to verify", "panel__status--idle");
      appendLog("MQTT settings written. Reconnecting MQTT now.");
      await runCommandExpectOk("mqtt reconnect", 8000);
      try {
        const { connected } = await readMqttStatus(8000);
        if (activeMqttBrokerIds.size === 0) {
          setText(stateMqtt, connected ? "Connected" : "Disconnected");
          setText(summaryMqtt, connected ? "mqtt.connected=true" : "mqtt.connected=false");
        }
      } catch (error) {
        if (activeMqttBrokerIds.size === 0) {
          setText(stateMqtt, "Unknown");
          setText(summaryMqtt, "MQTT status unknown");
        }
        appendLog(`MQTT status check warning: ${error.message}`);
      }
    }
  } catch (error) {
    setPanelState(settingsState, "Failed", "panel__status--error");
    appendLog(`Configuration failed: ${error.message}`);
    markApplyFailure();
  }
}

settingsApplyButton?.addEventListener("click", () => applySettings("all"));
settingsApplyDeviceWifiButton?.addEventListener("click", () => applySettings("device-wifi"));
settingsApplyMqttButton?.addEventListener("click", () => applySettings("mqtt"));
if (configureButton) {
  configureButton.addEventListener("click", () => applySettings("all"));
}

clearLogButton.addEventListener("click", () => {
  logPane.innerHTML = "";
  appendLog("Log cleared.");
});

populateBoards();
evaluateCapabilities();
applyRadioPreset("EU_UK_RECOMMENDED");
setUiMode(UI_MODES.ADVANCED);

// Initialize firmware branch from storage
(function initFirmwareBranch() {
  try {
    const savedBranch = window.localStorage.getItem(FIRMWARE_BRANCH_STORAGE_KEY);
    if (savedBranch && (savedBranch === "main" || savedBranch === "dev")) {
      firmwareBranchSelect.value = savedBranch;
      currentFirmwareBranch = savedBranch;
    }
  } catch (e) {
    // ignore storage errors
  }
})();

updateAdditionalBrokerVisibility();
updateBrokerTopicPreviews();
buildCommandPreview();
updateSerialButton();
updateBackupExportAvailability();
closeBoardMenu();
appendLog(`Loaded ${firmwareData.boards.length} board definitions.`);
