ABOUT THE TOOL
--------------

SNMPSniffer is an open source (GPLv3) desktop application with a graphic interface to sniff SNMP packets in the network. The data can be saved into a file. The application is written using Node.js and is run in a browser - Chrome or Firefox. 

FEATURES
--------

- Run in Google Chrome or Forefox browsers
- Filters by ip, port, direction
- The results are displayed 
- The results can be saved into a file
- An option to run SNMP commands from the interface


PREREQUISITS
------------

The application runs on Linux (Debian, Ubuntu, Mint, Fedora, OpenSUSE etc) and OS X (Mac) operating systems.

SNMP commands can be run on the computer using net-snmp. 

NOTE: running the application requires administrator (sudo) privileges. 


INSTALLATION AND INSTALLATION PATH
----------------------------------

General
-------

1. You need packet capturing software installed on your machine, such as libpcap. For Linux machines it's recommended to install libpcap-dev or such. For Mac machines, the library is usually installed by default. If the npm libraries don't compile, it might mean that libpcap is not installed. 

2. Install Google Chrome or Mozilla Forefox.

The application is run in a browser and requires Forefox or Chrome browser installed. If both are installed, the default browser is Chrome. 

Forefox can be downloaded from:
http://www.mozilla.org/en-US/firefox/new/

Google Chrome can be downloaded from:
https://www.google.com/intl/en/chrome/browser/

Other browsers are not supported at the present time. 


For MAC OS X Users
------------------

1. Install Nodejs

The application requires Nodejs to run, version 0.10 or above. Download Nodejs for Mac OS X and install it according to http://nodejs.org/download/. 

2. Some npm libraries are built during the application installation, so node-gyp is required. Check if it's installed:

> which node-gyp

Installation instructions for node-gyp:
https://github.com/TooTallNate/node-gyp

3. Install SNMPSniffer

Download SNMPSniffer for Mac OS X from www.calaverastech.com/installers. Uncompress the folder. 

Double click on SNMPSniffer-v1.0.mpkg
The application installation path will be /usr/local/bin/snmpsniffer script and /usr/local/lib/node_modules/snmpsniffer folder

NOTE: the process opens a shell to download and install some npm packages. Depending on your Internet connection, you might see errors (marked in red) and/or  the application might fail starting in a shell with a message that some package is not installed. If it happens, it means there is a problem with internet connection and some or all packages were not loaded. Verify your internet connection, close applications that consume too much bandwidth and resources; then uninstall the application and install it again. 


For Linux Users
---------------

1. Install Nodejs

The application requires Nodejs to run, version 0.10 or above. Download Nodejs for Linux and install it according to http://nodejs.org/download/. The "node" application should be added to the path. Check the version with:

> node -v

2. Some npm libraries are built during the application installation, so node-gyp is required. Check if it's installed:

> which node-gyp

Installation instructions for node-gyp:
https://github.com/TooTallNate/node-gyp

3. Install SNMPSniffer

Download Netplayback for Linux from www.calaverastech.com/installers. Uncompress the folder and as a root make the install and uninstall scripts executable:

> sudo chmod +x install.sh
> sudo chmod +x uninstall.sh

Double click on install or run

> ./install.sh

The application installation path will be /usr/local/bin/snmpsniffer script and /usr/local/lib/node_modules/snmpsniffer folder

NOTE: the process opens a shell to download and install some npm packages. Depending on your Internet connection, you might see errors (marked in red) and/or  the application might fail starting in a shell with a message that some package is not installed. If it happens, it means there is a problem with internet connection and some or all packages were not loaded. Verify your internet connection, close applications that consume too much bandwidth and resources; then uninstall the application and install it again. 

4. If you don't see the application in the desktop menu, you may want to restart the desktop. 


RUNNING THE APPLICATION
-----------------------

1. Launching from the menu or Desktop shortcut

Mac users: The application can be launched from Launchpad, the Applications folder or double clicking on SNMPSniffer.app or from a Desktop shortcut

Linux users: The application can be launched from the Programming menu, or a Desktop shortcut and launch panel shortcuts can be created

Close the application by pressing the button "Exit" or closing the browser window. 

2. Launching in the command line

To start the application, type:
> sudo snmpsniffer

To start the application without launching the browser, type:
> sudo snmpsniffer --nobrowser

Then to launch a browser, open either Chrome or Firefox and type in the address line:
localhost:5000

To start the application with Chrome, type:
> sudo snmpsniffer --chrome

To start the application with Forefox, type:

> sudo snmpsniffer --firefox

For help with using the options, type:
> snmpsniffer --help


UNINSTALLATION
--------------

For Mac OS X users
------------------
Type snmpsniffer-uninstall in the command line or remove using Mac tools

For Linux users
---------------
Run uninstall script from the application folder


LIBRARIES USED
--------------

For listenings for packages, the application uses the library node_pcap https://github.com/mranney/node_pcap . 


OPEN SOURCE CONTRIBUTIONS, BUGS REPORTS ANF NEW FEATURE REQUESTS
----------------------------------------------------------------

SNMPSniffer is an open source tool released under a GPLv3 license. The source code is located at the GitHub repository https://github.com/calaveras/snmpsniffer.

If you find any problem with the application or have feature suggestions, please, don't hesitate to submit them. If you want to contribute code or fix a bug, clone the repository on GitHub and submit a pull request. Your contributions are always welcome!

CONTACTS
--------

You can also contact support@calaverastech.com with your bug reports, features and suggestions. Our google group is https://groups.google.com/forum/?hl=en#!forum/calaverascoding . Subscribe directly or subscribe from https://www.calaverastech.com/company to be added.

Copyright (c) 2015 Calaveras Technologies Inc 
www.calaverastech.com


