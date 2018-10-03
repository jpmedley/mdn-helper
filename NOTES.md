# Development notes

NOT FOR RELEASE VERSION

## Feature: Question types

* String - Examples include most of what's there now.
* Enum - Example: `readOnly` would ask 'Is this item read only? Yes or No?' but would render 'read-only' or '' (empty string) respectively.
* Boolean
* List - 

## New commands

`fromIdl`: Takes and interface name, finds the IDL and asks the appropriate questions.
`validate`: Validates that question files contain the same keys.

## Command changes

* The `interface` command needs a -pr flag which means 'read-only property' so that 'Is it read only' need not be asked when it's provided by the IDL.
