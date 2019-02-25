# Configuring MDN helper

The configuration file is located at `config/local.json`. There are only a few configuration values that you as a user would ever need to touch.

# Application.help

Indicates how much verbiage is printed to the screen to assist you in creating pages.

* `CONCISE`: Very little extra text is printed to the screen. You may want to change to this value after you are familiar with the application.

* `VERBOSE`: (Default) Lengthy instructions are printed to the screen.

# Application.outputDirectory

Indicates the folder where you would like the results of `build` and `burn` commands to be written. The default value is `$HOME/Desktop/out/`.
