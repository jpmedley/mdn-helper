---
layout: 'layouts/doc-post.njk'
title: [[shared:interface]].[[method]]()
description: >
  The **`entries()`** method of the [[shared:interface]] interface returns an array of a given object's own enumerable property `[key, value]` pairs, in the same order as that provided by a `for...in` loop (the difference being that a for-in loop enumerates properties in the prototype chain as well).
[[subHead]]
date: [[date]]
---

The **`entries()`** method of the [[shared:interface]] interface returns an array of a given object's own enumerable property `[key, value]` pairs, in the same order as that provided by a `for...in` loop (the difference being that a for-in loop enumerates properties in the prototype chain as well).

[[status]]

[[tryIt]]

## Syntax

```js
[[shared:interface]].entries(obj);
```

### Parameters

- `obj`
  - : The [[shared:interface]] whose enumerable own property `[key, value]` pairs are to be returned.

### Return value

An array of the given `[[shared:interface]]` object's own enumerable property `[key, value]` pairs.

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

{% BrowserCompat 'api.[[shared:interface]].entries()' %}

[[see-also]]