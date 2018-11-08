# Development notes

NOT FOR RELEASE VERSION

## Feature: Memory

When doing multiple methods or properties, some questions have the same answer between members. Why not use the last-provided answer as the default for the current one, provided there is not a default in the questions file.

## Features for 0.14.0

* Make template processing recursive and based on common sections. For example `reference.html` > `_frag_properties.html` > `_frag_property.html`.
* Base `find` command on an index so that users can search on API names instead of file names.
* Output BCD boilerplate for entry and remaining build commands.  
* Add admin commands including `validate` which validates that question files contain the same keys.

## To Do

* Change `shared:formalAPIName` to `shared:apiName` throughout. Anywhere that it should be suffixed with 'API' add it to the template. Give this a follow-up task that ensures it's not present twice.

* Deal more completely with inheritance.
