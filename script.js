import { defaultTransformers } from "link-to-iframe";

/**
 * @import {IframeAttributes,Transformer} from "link-to-iframe"
 */

const transformerPdf = defaultTransformers.find(({ key }) => key === "pdf");

if (transformerPdf) {
  transformerPdf.name = "PDF (via Google Docs)";
}

defaultTransformers.sort((a, b) => a.name.localeCompare(b.name));

const COOKIE_CONSENT_VERSION = "__Secure-cv";

const COOKIE_CONSENT_PLATFORMS = "__Secure-cp";

/**
 * 6 months in milliseconds.
 */
const COOKIE_MAX_AGE_MS = 15770000000;

const CURRENT_CONSENT_VERSION = "0";

const embedContainerCollection = document.getElementsByClassName("embed-container");
const privacySettingsButtonCollection = document.getElementsByClassName("btn-privacy-settings-footer");
const thirdPartyAcceptCollection = document.getElementsByClassName("third-party-accept");
const thirdPartyDialogFormCollection = document.getElementsByClassName("third-party-dialog-form");
const thirdPartyRejectCollection = document.getElementsByClassName("third-party-reject");

const privacySettingsAside0 = document.getElementById("privacy-settings-0");

const theme = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";

let processing = false;

document.getElementById("third-party-dialog-form-0")?.addEventListener("submit", async event => {
  /**
   * When disabling the button, the dialog doesn't close. That is the reason why is not implemented.
   */

  if (processing) {
    return;
  }

  const formEl = event.currentTarget;

  if (!(formEl instanceof HTMLFormElement) || !(event.submitter instanceof HTMLButtonElement) || event.submitter.value !== "save") {
    return;
  }

  processing = true;

  if (privacySettingsAside0) {
    privacySettingsAside0.hidden = true;
  }

  const platformList = new FormData(formEl).getAll("third-party");

  await cookieStore.set({
    expires: Date.now() + COOKIE_MAX_AGE_MS,
    name: COOKIE_CONSENT_PLATFORMS,
    partitioned: false,
    path: "/",
    sameSite: "lax",
    value: platformList.join(",")
  });

  const platformSet = new Set(platformList);

  for (let i = 0; i < embedContainerCollection.length; i++) {
    const embedContainer = embedContainerCollection[i];

    if (embedContainer instanceof HTMLElement) {
      const a = embedContainer.children[0];

      if (a instanceof HTMLAnchorElement) {
        if (embedContainer.dataset.platform) {
          const transformer = defaultTransformers.find(({ key }) => key === embedContainer.dataset.platform);

          if (transformer) {
            const secondChild = embedContainer.children[1];

            if (platformSet.has(transformer.key)) {
              if (!(secondChild instanceof HTMLIFrameElement)) {
                let matches = transformer.pattern?.exec(a.href);

                if (!matches && transformer.patterns?.length) {
                  let j = 0;

                  do {
                    matches = transformer.patterns[j]?.exec(a.href);
                    j++;
                  } while (!matches && j < transformer.patterns.length);
                }

                if (matches) {
                  const attributes = transformer.transform(a.href, matches);

                  if (attributes) {
                    a.hidden = true;
                    secondChild?.remove();
                    embedContainer.append(createEmbedIframe(attributes, transformer.key));
                  }
                }
              }
            } else if (!(secondChild instanceof HTMLParagraphElement)) {
              a.hidden = false;
              secondChild?.remove();
              embedContainer.append(createEmbedParagraph(transformer.name));
            }
          }
        } else {
          /**
           * @type {(RegExpExecArray|null|undefined)}
           */
          let matches;

          /**
           * @type {Transformer|undefined}
           */
          let transformer;

          let i = 0;

          do {
            transformer = defaultTransformers[i];

            if (transformer) {
              matches = transformer.pattern?.exec(a.href);

              if (!matches && transformer.patterns?.length) {
                let j = 0;

                do {
                  matches = transformer.patterns[j]?.exec(a.href);
                  j++;
                } while (!matches && j < transformer.patterns.length);
              }
            }

            i++;
          } while (!matches && i < defaultTransformers.length);

          if (matches && transformer) {
            embedContainer.dataset.platform = transformer.key;

            if (platformSet.has(transformer.key)) {
              const attributes = transformer.transform(a.href, matches);

              if (attributes) {
                a.hidden = true;
                embedContainer.append(createEmbedIframe(attributes, transformer.key));
              }
            } else {
              a.hidden = false;
              embedContainer.append(createEmbedParagraph(transformer.name));
            }
          }
        }
      }
    }
  }

  processing = false;
});

/**
 * @type {Set<HTMLInputElement>}
 */
const thirdPartyCheckboxSet = new Set();

for (let i = 0; i < thirdPartyDialogFormCollection.length; i++) {
  const thirdPartyDialog = thirdPartyDialogFormCollection[i];

  if (thirdPartyDialog) {
    const ul = document.createElement("ul");

    ul.className = "third-party-list";

    for (const transformer of defaultTransformers) {
      const inputId = transformer.key + "-" + i;

      const label = document.createElement("label");

      label.htmlFor = inputId;
      label.textContent = transformer.name;

      const inputCheckbox = document.createElement("input");

      inputCheckbox.className = "third-party-checkbox";
      inputCheckbox.id = inputId;
      inputCheckbox.name = "third-party";
      inputCheckbox.type = "checkbox";
      inputCheckbox.value = transformer.key;

      inputCheckbox.setAttribute("switch", "");

      thirdPartyCheckboxSet.add(inputCheckbox);

      const li = document.createElement("li");

      li.append(label, inputCheckbox);

      ul.append(li);
    }

    thirdPartyDialog.prepend(ul);
  }
}

/**
 * @async
 * @function acceptAllThirdParties
 */
async function acceptAllThirdParties() {
  /**
   * When disabling the button, the dialog doesn't close. That is the reason why is not implemented.
   */

  if (processing) {
    return;
  }

  processing = true;

  const dateNow = Date.now();

  await cookieStore.set({
    expires: dateNow + COOKIE_MAX_AGE_MS,
    name: COOKIE_CONSENT_PLATFORMS,
    partitioned: false,
    path: "/",
    sameSite: "lax",
    value: defaultTransformers.map(({ key }) => key).join(",")
  });

  await cookieStore.set({
    expires: dateNow + COOKIE_MAX_AGE_MS,
    name: COOKIE_CONSENT_VERSION,
    partitioned: false,
    path: "/",
    sameSite: "lax",
    value: CURRENT_CONSENT_VERSION
  });

  if (privacySettingsAside0) {
    privacySettingsAside0.hidden = true;
  }

  for (let i = 0; i < embedContainerCollection.length; i++) {
    const embedContainer = embedContainerCollection[i];

    if (embedContainer instanceof HTMLElement) {
      const a = embedContainer.children[0];

      if (a instanceof HTMLAnchorElement) {
        const secondChild = embedContainer.children[1];

        if (!secondChild || !(secondChild instanceof HTMLIFrameElement)) {
          secondChild?.remove();

          /**
           * @type {(RegExpExecArray|null|undefined)}
           */
          let matches;

          /**
           * @type {Transformer|undefined}
           */
          let transformer;

          if (embedContainer.dataset.platform) {
            transformer = defaultTransformers.find(({ key }) => key === embedContainer.dataset.platform);
            matches = transformer?.pattern?.exec(a.href);

            if (!matches && transformer?.patterns?.length) {
              let j = 0;

              do {
                matches = transformer.patterns[j]?.exec(a.href);
                j++;
              } while (!matches && j < transformer.patterns.length);
            }
          } else {
            let i = 0;

            do {
              transformer = defaultTransformers[i];

              if (transformer) {
                matches = transformer.pattern?.exec(a.href);

                if (!matches && transformer.patterns?.length) {
                  let j = 0;

                  do {
                    matches = transformer.patterns[j]?.exec(a.href);
                    j++;
                  } while (!matches && j < transformer.patterns.length);
                }
              }

              i++;
            } while (!matches && i < defaultTransformers.length);

            embedContainer.dataset.platform = transformer?.key;
          }

          if (matches && transformer) {
            const attributes = transformer.transform(a.href, matches);

            if (attributes) {
              a.hidden = true;
              embedContainer.append(createEmbedIframe(attributes, transformer.key));
            }
          }
        }
      }
    }
  }

  for (const inputCheckbox of thirdPartyCheckboxSet) {
    inputCheckbox.checked = true;
  }

  processing = false;
}

/**
 * @function createEmbedIframe
 * @param {IframeAttributes} attributes
 * @param {string} platformKey
 * @returns {HTMLIFrameElement}
 */
function createEmbedIframe(attributes, platformKey) {
  const url = new URL(attributes.src);

  if (url.hostname === "www.youtube.com") {
    url.hostname = "www.youtube-nocookie.com";
  }

  url.searchParams.set("dnt", "true");
  url.searchParams.set("frame", "false");
  url.searchParams.set("lang", "en");
  url.searchParams.set("theme", theme);

  const iframe = document.createElement("iframe");

  iframe.className = "embed " + platformKey;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.scrolling = "no";
  iframe.src = url.toString();
  iframe.setAttribute("allowtransparency", "true");
  iframe.setAttribute("frameborder", "0");

  if (attributes.allow) {
    iframe.allow = attributes.allow;
  }

  if (attributes.allowfullscreen) {
    iframe.setAttribute("allowfullscreen", "true");
  }

  if (attributes.height) {
    iframe.height = attributes.height.toString();
  }

  if (attributes.width) {
    iframe.width = attributes.width.toString();
  }

  return iframe;
}

/**
 * @function createEmbedParagraph
 * @param {string} platformName
 * @returns {HTMLParagraphElement}
 */
function createEmbedParagraph(platformName) {
  const btn = document.createElement("button");

  btn.className = "btn-privacy-settings";
  btn.textContent = "Privacy Settings";
  btn.addEventListener("click", openPrivacySettings);

  const p = document.createElement("p");

  p.className = "embed-p";

  p.append("Consent " + platformName + " embeds in ", btn, " to load the content.");

  return p;
}

/**
 * @function openPrivacySettings
 */
function openPrivacySettings() {
  if (privacySettingsAside0) {
    privacySettingsAside0.hidden = !privacySettingsAside0.hidden;
  }
}

/**
 * @async
 * @function rejectAllThirdParties
 */
async function rejectAllThirdParties() {
  /**
   * When disabling the button, the dialog doesn't close. That is the reason why is not implemented.
   */

  if (processing) {
    return;
  }

  processing = true;

  await cookieStore.delete(COOKIE_CONSENT_PLATFORMS);

  await cookieStore.set({
    expires: Date.now() + COOKIE_MAX_AGE_MS,
    name: COOKIE_CONSENT_VERSION,
    partitioned: false,
    path: "/",
    sameSite: "lax",
    value: CURRENT_CONSENT_VERSION
  });

  if (privacySettingsAside0) {
    privacySettingsAside0.hidden = true;
  }

  for (let i = 0; i < embedContainerCollection.length; i++) {
    const embedContainer = embedContainerCollection[i];

    if (embedContainer instanceof HTMLElement) {
      const a = embedContainer.children[0];

      if (a instanceof HTMLAnchorElement) {
        a.hidden = false;

        const secondChild = embedContainer.children[1];

        if (!secondChild || !(secondChild instanceof HTMLParagraphElement)) {
          secondChild?.remove();

          let platformName = "";

          if (embedContainer.dataset.platform) {
            platformName = defaultTransformers.find(({ key }) => key === embedContainer.dataset.platform)?.name ?? "";
          } else {
            /**
             * @type {(RegExpExecArray|null|undefined)}
             */
            let matches;

            /**
             * @type {Transformer|undefined}
             */
            let transformer;

            let i = 0;

            do {
              transformer = defaultTransformers[i];

              if (transformer) {
                matches = transformer.pattern?.exec(a.href);

                if (!matches && transformer.patterns?.length) {
                  let j = 0;

                  do {
                    matches = transformer.patterns[j]?.exec(a.href);
                    j++;
                  } while (!matches && j < transformer.patterns.length);
                }
              }

              i++;
            } while (!matches && i < defaultTransformers.length);

            if (transformer) {
              embedContainer.dataset.platform = transformer.key;
              platformName = transformer.name;
            }
          }

          embedContainer.append(createEmbedParagraph(platformName));
        }
      }
    }
  }

  for (const inputCheckbox of thirdPartyCheckboxSet) {
    inputCheckbox.checked = false;
  }

  processing = false;
}

for (let i = 0; i < privacySettingsButtonCollection.length; i++) {
  privacySettingsButtonCollection[i]?.addEventListener("click", openPrivacySettings);
}

for (let i = 0; i < thirdPartyAcceptCollection.length; i++) {
  thirdPartyAcceptCollection[i]?.addEventListener("click", acceptAllThirdParties);
}

for (let i = 0; i < thirdPartyRejectCollection.length; i++) {
  thirdPartyRejectCollection[i]?.addEventListener("click", rejectAllThirdParties);
}

cookieStore.get(COOKIE_CONSENT_VERSION).then(async cookie => {
  if (cookie?.value !== CURRENT_CONSENT_VERSION) {
    if (privacySettingsAside0) {
      privacySettingsAside0.hidden = false;
    }

    return;
  }

  const platformSet = new Set((await cookieStore.get(COOKIE_CONSENT_PLATFORMS))?.value?.split(","));

  for (let i = 0; i < embedContainerCollection.length; i++) {
    const embedContainer = embedContainerCollection[i];

    if (embedContainer instanceof HTMLElement) {
      const a = embedContainer.children[0];

      if (a instanceof HTMLAnchorElement) {
        /**
         * @type {(RegExpExecArray|null|undefined)}
         */
        let matches;

        /**
         * @type {Transformer|undefined}
         */
        let transformer;

        let i = 0;

        do {
          transformer = defaultTransformers[i];

          if (transformer) {
            matches = transformer.pattern?.exec(a.href);

            if (!matches && transformer.patterns?.length) {
              let j = 0;

              do {
                matches = transformer.patterns[j]?.exec(a.href);
                j++;
              } while (!matches && j < transformer.patterns.length);
            }
          }

          i++;
        } while (!matches && i < defaultTransformers.length);

        if (matches && transformer) {
          embedContainer.dataset.platform = transformer.key;

          if (platformSet.has(transformer.key)) {
            const attributes = transformer.transform(a.href, matches);

            if (attributes) {
              a.hidden = true;
              embedContainer.append(createEmbedIframe(attributes, transformer.key));
            }
          } else {
            a.hidden = false;
            embedContainer.append(createEmbedParagraph(transformer.name));
          }
        }
      }
    }
  }

  for (const inputCheckbox of thirdPartyCheckboxSet) {
    inputCheckbox.checked = platformSet.has(inputCheckbox.value);
  }
});
