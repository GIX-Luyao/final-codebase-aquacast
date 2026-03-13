# AquaCast

Data Collection for Ocean Monitoring

Drone-Based Multi-Depth Water Sampling System


## Project Overview

AquaCast is an autonomous water sampling system designed to simplify environmental monitoring in lakes and other bodies of water.

Traditional water sampling requires researchers to travel by boat and manually collect samples at different depths, which can be time-consuming and physically demanding.

AquaCast integrates a drone with an automated underwater sampling device to collect multiple water samples during a single deployment.

The system allows researchers to remotely deploy the device, collect samples at preset depths, and retrieve them efficiently.

This system is designed for environmental researchers, water quality monitoring teams, and public health agencies who need an efficient and scalable sampling solution.


## Key Features

- Drone-based deployment of a water sampling device
- Automatic multi-depth water sampling
- Mission configuration through a digital dashboard
- Organized storage of multiple water samples
- Data logging during sampling missions


## Project Structure


aquacast
│
├── src/
│ Main system source code
│
├── docs/
│ Documentation and user manual
│
├── assets/
│ Images, diagrams, and project visuals
│
├── requirements.txt
│ Python dependencies
│
└── README.md
Project documentation



## System Requirements


### Software

Python 3.9 or later

Supported operating systems:

- Windows 10+
- macOS
- Ubuntu


Required Python libraries are listed in:


requirements.txt


Install dependencies using:


pip install -r requirements.txt



### Hardware

The AquaCast system requires:

- Drone with payload capability
- AquaCast water sampling device
- Rechargeable battery pack
- Sample bottles


## Installation


### Step 1 Clone the Repository


git clone <[repository-url](https://github.com/GIX-Luyao/final-codebase-aquacast.git)>



Navigate into the project directory:


cd final-codebase-aquacast



### Step 2 Install Dependencies


pip install -r requirements.txt



### Step 3 Prepare the System

1. Assemble the sampling device

2. Insert the sample bottles into the device

3. Mount the device securely on the drone

4. Power on the drone and the sampling device


## Running the System

Run the main control program:


python src/main.py


The system will initialize the drone connection and prepare the sampling mission.


## Expected System Behavior

After executing the program, the system will:

- Initialize communication with the drone
- Load mission parameters
- Deploy the sampling device
- Collect water samples at predefined depths
- Record mission data
- Return the device to the surface for retrieval


## Technical Architecture

The AquaCast system consists of several modules.


Drone Control Module

Handles communication between the drone and the sampling device.


Sampling Control System

Controls bottle switching and depth-triggered sampling.


Mission Dashboard

Provides a user interface for configuring sampling missions and recording mission data.


## User Manual

A detailed user manual for installation, operation, and safety guidelines is included in:


docs/AquaCast＿UserManual.pdf



## Team Members

Shareef Jasim (shareef1@uw.edu)

Joyce Chou (ychou3@uw.edu)

Chang Li (lic170@uw.edu)

Victoria Yang (vicjny@uw.edu)


## License

This project is developed for academic purposes as part of a university engineering
