# personal-addon

<a href="https://nikolockenvitz.github.io/personal-addon/">
<img src="https://nikolockenvitz.github.io/personal-addon/icons/personal-addon-48.png" height="20px" /></a>
<!-- SHIELD IO BADGES INSTALL START -->
<a href="https://nikolockenvitz.github.io/personal-addon/xpi/personal_addon-0.0.12-fx.xpi">
<img src="https://img.shields.io/badge/firefox-v0.0.12-FF7139?logo=firefox-browser" alt="Install for Firefox" /></a>
<!-- SHIELD IO BADGES INSTALL END -->

Personal addon to test some browser extension stuff easily.

To enable *Open URLs From Clipboard* also for file:/// URLs, add the following three entries in about:config [[source]](https://github.com/fastaddons/GroupSpeedDial/issues/36#issuecomment-788283828):

```
capability.policy.policynames = "localfilelinks"
capability.policy.localfilelinks.checkloaduri.enabled = "allAccess"
capability.policy.localfilelinks.sites = "moz-extension://INTERNAL_UUID_OF_THE_ADDON"
```

The Internal UUID can be found on [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox).
