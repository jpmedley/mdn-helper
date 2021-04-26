# Configuring MDN helper

The configuration file is located at `config/local.json`. There are only a few configuration values that you as a user would ever need to touch.


# Application.bcdCommitDirectory

The folder where you want browser compatibility data to be written.

# Application.help

The amount of help text printed to the screen in interactive mode. Interactive mode is an advanced feature. You should create three or four APIs without interactive mode to become familliar with MDN Helper's output before attempting to use interactive mode.

* `CONCISE`: Very little extra text is printed to the screen. You may want to change to this value after you are familiar with the application.

* `VERBOSE`: (Default) Lengthy instructions are printed to the screen.

# Application.outputDirectory

The folder where you want the results of `build` and `burn` commands to be written. The default value is `$HOME/Desktop/out/`.
