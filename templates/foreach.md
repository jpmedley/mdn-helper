---
title: [[shared:interface]].forEach()
slug: Web/API/[[shared:interface]]/forEach
tags:
  - API
  - forEach
  - Method
  - Reference
  - [[method]]
  - [[shared:interface]][[shared:experimental]]
browser-compat: api.[[shared:interface]].forEach
---
<div>[[shared:isSecureContext]]{{DefaultAPISidebar("[[shared:sidebarMacro]]")}}

The **`[[shared:interface]].forEach()`** method executes a provided function once for each element of {{domxref('[[shared:interface]]')}}.

## Syntax

<pre class="brush: js">[[shared:interface]].forEach(function callback(currentValue[, index[, array]]) {
    //your iterator
}[, thisArg]);</pre>

### Parameters

<dl>

<dt>`callback`</dt>

<dd>The function to execute for each element, taking three arguments:

<dl>

<dt>`currentValue`</dt>

<dd>The value of the current element being processed.</dd>

<dt>`index`{{optional_inline}}</dt>

<dd>The index of the current element being processed.</dd>

<dt>`array`{{optional_inline}}</dt>

<dd>The [[shared:interface]] that`forEach()` is being called on.</dd>

</dl>

</dd>

<dt>`thisArg` {{Optional_inline}}</dt>

<dd>

Value to use as `**this**` (i.e the reference `Object`) when executing `callback`.

</dd>

</dl>

### Return value

{{jsxref("undefined")}}.

## Examples

Fill in a simple example that nicely shows a typical usage of the API, then perhaps some more complex examples (see our guide on how to add [code examples](/en-US/docs/MDN/Contribute/Structures/Code_examples) for more information).

This text should be replaced with a brief description of what the example demonstrates.

<pre class="brush: js">my code block</pre>

And/or include a list of links to useful code samples that live elsewhere:

*   x
*   y
*   z

## Specifications

{{Specifications}}

## Browser compatibility

<div class="hidden">The compatibility table in this page is generated from structured data. If you'd like to contribute to the data, please check out [https://github.com/mdn/browser-compat-data](https://github.com/mdn/browser-compat-data) and send us a pull request.</div>

{{Compat}}

[[see-also]]