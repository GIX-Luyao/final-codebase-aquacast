
# AquaCast

Drone-Based Multi-Depth Water Sampling System for Ocean Monitoring

AquaCast is a drone-deployed water sampling system designed to simplify environmental monitoring in lakes and other bodies of water. The system allows researchers to collect water samples at multiple depths during a single deployment, improving efficiency and reducing the need for manual boat-based sampling.

This project was developed as part of the University of Washington Global Innovation Exchange (UWGIX) engineering capstone project.

---

## Project Overview

Traditional water sampling requires researchers to travel to sampling locations by boat and manually collect samples at different depths. This process can be time-consuming, physically demanding, and sometimes unsafe. AquaCast addresses this problem by integrating a drone with an automated water sampling device. The system enables users to deploy the sampling device remotely and collect multiple water samples during a single mission.

---

## Key Features

- Drone-based deployment of a water sampling device
- Automatic multi-depth water sampling
- Multiple sample bottle storage
- Prototype testing using Arduino control

---

## Repository Structure

```
final-codebase-aquacast
│
├── arduino/
│   Arduino code used for prototype testing
│
├── docs/
│   Project documentation and user manual
│
└── README.md
    Project description
```

---

## Arduino Code

The Arduino code used for the prototype air testing demo is located in:

arduino/

This Arduino program controls the sampling device during prototype testing and demonstrates the triggering mechanism used for water sample collection.

To run the Arduino program:

1. Open the .ino file using Arduino IDE.
2. Connect the Arduino board to your computer.
3. Select the correct board and port in Arduino IDE.
4. Upload the program to the Arduino device.

---

## Expected System Behavior

After uploading the Arduino program and powering the device, the system will:

1. Initialize the sampling control system.
2. Wait for the sampling trigger signal.
3. Activate the sampling mechanism.
4. Simulate the sample collection process for testing.

This air testing demo verifies that the sampling trigger and control logic function correctly before field deployment.

---

## User Manual

A detailed user manual describing system setup, installation, operation, and safety guidelines is included in:

docs/AquaCast＿UserManual.pdf

---

## Team Members

Shareef Jasim — shareef1@uw.edu  
Joyce Chou — ychou3@uw.edu  
Chang Li — lic170@uw.edu  
Victoria Yang — vicjny@uw.edu  

University of Washington  
Global Innovation Exchange (GIX)

---

## License

This project is developed for academic purposes as part of a university engineering course.
