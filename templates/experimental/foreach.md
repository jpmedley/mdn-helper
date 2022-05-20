---
title: [[shared:interface]].forEach()
slug: Web/API/[[shared:interface]]/forEach
tags:
  - forEach
  - Method
  - Reference
browser-compat: api.[[shared:interface]].forEach
---
[[shared:isSecureContext]]{{DefaultAPISidebar("[[shared:sidebarMacro]]")}}

The **`[[shared:interface]].forEach()`** method executes a provided function once for each element of {{domxref('[[shared:interface]]')}}.

## Syntax

```js
forEach(callback);
forEach(callback, thisArg);
```

### Parameters

- `callback`
  - : The function to execute for each element, taking three arguments:

    - `element`
      - : The value of the current element being processed.
    - `index`
      - : The index of the current element being processed.
    - `array`
      - : The [[shared:interface]] that`forEach()` is being called on.

- `thisArg`
  - : Value to use as `**this**` (i.e the reference `Object`) when executing `callback`.

### Return value

{{jsxref("undefined")}}.

## Examples

Fill in a simple example that nicely shows a typical usage of the API, then perhaps some more complex examples (see our guide on how to add [code examples](/en-US/docs/MDN/Contribute/Structures/Code_examples) for more information).

This text should be replaced with a brief description of what the example demonstrates.

```js
my code block
```

And/or include a list of links to useful code samples that live elsewhere:

*   x
*   y
*   z

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}

[[see-also]]