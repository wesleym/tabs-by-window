// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

interface TabRecord {
  tab: chrome.tabs.Tab;
  children: TabRecord[];
}

interface WindowRecord {
  window: chrome.windows.Window;
  tabs: TabRecord[];
}

/**
 * Returns a function to be used as the callback when a tab entry is clicked.
 *
 * @param windowId The ID of the window containing the selected tab.
 * @param tabId The ID of the selected tab.
 * @return The callback to be called.
 */
function clickback(windowId: number, tabId: number) {
  return () => {
    chrome.windows.update(windowId, {focused: true});
    chrome.tabs.update(tabId, {active: true});
    window.close();
  };
}


/**
 * Returns a function to be used as the callback when the close button is
 * clicked.
 *
 * @param tabId The ID of the tab to be closed.
 * @return The callback to be called.
 */
function closeback(tabId: number): EventListener {
  return (event) => chrome.tabs.remove(tabId);
}


/**
 * Renders a single tab. This function calls itself recursively to render all
 * tabs that are children of the current tab.
 *
 * @param windowRecord The window record for the window containing this tab.
 * @param tabRecord The tab record representing the tab to be rendered.
 * @return The root element representing this tab and its children tabs.
 */
function renderTab(windowRecord: WindowRecord, tabRecord: TabRecord): Node {
  const tabTemplate = document.querySelector('#tab') as HTMLTemplateElement;
  (tabTemplate.content.querySelector('.favicon') as HTMLImageElement).src =
      tabRecord.tab.favIconUrl || 'data:';
  const tabEl = document.importNode(tabTemplate.content, true);
  const tabFavIcon = tabEl.querySelector('.favicon')!;
  tabFavIcon.addEventListener(
      'click', clickback(windowRecord.window.id!, tabRecord.tab.id!));
  const tabTextEl = tabEl.querySelector('.tabtext')!;
  tabTextEl.addEventListener(
      'click', clickback(windowRecord.window.id!, tabRecord.tab.id!));
  tabTextEl.textContent = tabRecord.tab.title as string;
  const closeButton = tabEl.querySelector('.close')!;
  closeButton.addEventListener('click', closeback(tabRecord.tab.id!));
  const childrenEl = tabEl.querySelector('.children')!;
  for (const child of tabRecord.children) {
    childrenEl.appendChild(renderTab(windowRecord, child));
  }
  return tabEl;
}


/**
 * Clears and renders into the extension popup.
 *
 * @param windowRecords An array of window records containing nested tab records
 *     to render.
 */
function renderPopup(windowRecords: WindowRecord[]) {
  const container = document.createElement('div');
  for (let i = 0; i < windowRecords.length; i++) {
    const windowEl = document.createElement('div');
    windowEl.className = 'window';
    const tabRecords = windowRecords[i].tabs;
    for (const tabRecord of tabRecords) {
      windowEl.appendChild(renderTab(windowRecords[i], tabRecord));
    }
    container.appendChild(windowEl);
    if (i < windowRecords.length - 1) {
      container.appendChild(document.createElement('hr'));
    }
  }
  document.body.innerHTML = '';
  document.body.appendChild(container);
}


/**
 * Creates a tree representation of tabs. Each tab record is the parent of
 * records representing tabs opened from that tab.
 *
 * @param windows An array of windows in the browser.
 * @return An array of window records, each containing a tree of tab records.
 */
function makeTabTree(windows: chrome.windows.Window[]): WindowRecord[] {
  const tabsById = new Map();
  const result: WindowRecord[] = [];

  for (const window of windows) {
    const tabs = window.tabs;
    if (!tabs) {
      continue;
    }
    for (const tab of tabs) {
      tabsById.set(tab.id, {'tab': tab, 'children': []});
    }
  }

  for (const tabsByIdEntry of tabsById) {
    const tab = tabsByIdEntry[1];
    const openerTabId = tab.tab.openerTabId;
    if (openerTabId != null) {
      const openerTab = tabsById.get(openerTabId);
      openerTab.children.push(tab);
    }
  }

  for (const window of windows) {
    const tabs = window.tabs;
    if (!tabs) {
      continue;
    }
    const accum: WindowRecord = {'window': window, 'tabs': []};
    for (const tab of tabs) {
      if (tab.openerTabId == null) {
        accum.tabs.push(tabsById.get(tab.id));
      }
    }
    if (accum.tabs.length > 0) {
      result.push(accum);
    }
  }

  return result;
}


/**
 * Redraws the content of the popup.
 */
function redrawAll() {
  chrome.windows.getAll(
      {populate: true}, windows => renderPopup(makeTabTree(windows)));
}

document.addEventListener('DOMContentLoaded', redrawAll);
chrome.tabs.onCreated.addListener(redrawAll);
chrome.tabs.onUpdated.addListener(redrawAll);
chrome.tabs.onMoved.addListener(redrawAll);
// Selected/active/highlighted tabs are not currently distinguished in UI and
// don't require a UI update
// chrome.tabs.onSelectionChanged.addListener(redrawAll);
// chrome.tabs.onActiveChanged.addListener(redrawAll);
// chrome.tabs.onActivated.addListener(redrawAll);
// chrome.tabs.onHighlightChanged.addListener(redrawAll);
// chrome.tabs.onHighlighted.addListener(redrawAll);
chrome.tabs.onDetached.addListener(redrawAll);
chrome.tabs.onAttached.addListener(redrawAll);
chrome.tabs.onRemoved.addListener(redrawAll);
chrome.tabs.onReplaced.addListener(redrawAll);
