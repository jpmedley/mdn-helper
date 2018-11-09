# Development notes

NOT FOR RELEASE VERSION

## Feature: Memory

When doing multiple methods or properties, some questions have the same answer between members. Why not use the last-provided answer as the default for the current one, provided there is not a default in the questions file.

## Features for later versions

* Build should process partials and callbacks.
* Interface should handle callbacks. (Currently a dummy value must be entered for -n because a single un-interfaced function cannot be entered.)
* Improve wrapping of questions and display of answers.
* Build should validate Kuma macros and API identifiers. For kuma macros that generate cross-references, it should ping the url. If 404 comes back, it should search for the IDL and ask appropriate questions.
* Build should fill in questions that can be answered from the IDL such as whether there's a constructor or whether something is read-only.
* Make template processing recursive and based on common sections. For example `reference.html` > `_frag_properties.html` > `_frag_property.html`.
* Base `find` command on an index so that users can search on API names instead of file names.
* Output BCD boilerplate for entry and remaining build commands.  
* Add admin commands including `validate` which validates that question files contain the same keys.
* When `find` and `build` present lists, they need to offer 'none' as an option.
* The prompt for the `APIRef()` macro should invoke a check that it exists in `GroupData.json`.

## To Do

* Change `shared:formalAPIName` to `shared:apiName` throughout. Anywhere that it should be suffixed with 'API' add it to the template. Give this a follow-up task that ensures it's not present twice.

* Deal more completely with inheritance.
