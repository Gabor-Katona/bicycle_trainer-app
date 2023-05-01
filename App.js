import React, { Component, useEffect } from 'react';
import {
  TouchableOpacity,
  NativeAppEventEmitter,
  View,
  ScrollView,
  SafeAreaView,
  Text,
  TextInput,
  Button,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import Geolocation from 'react-native-geolocation-service';
import KeepAwake from 'react-native-keep-awake';
import { stringToBytes } from "convert-string";
import { Buffer } from "buffer";
import DatabaseManager from './src/DatabaseManager';
import ConnectionHandlers from './src/components/ConnectionHandlers';

import { getServiceAndCharacteristics } from "./uitls"

// I changed this to export default App
export default class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      devices: [],
      connectedDevice: null,
      deviceConnectionInfo: [],
      writeMessage: "",
      readMessage: "",
      intervalId: null,
      interval2Id: null,
      lastEnvId: 1,
      lastGyro: null,
      requestCount: 0,
      measurementStarted: false,
      measurementNumber: 0,
      measurementPaused: false,
      startTime: 0,
      location: null,
      dbManager: new DatabaseManager(),
    };

    this.state.dbManager.dropTables();
    this.state.dbManager.createTables();

    this.state.dbManager.setMeasurmentNumber(this.handleUpdateState);
  }


  handleUpdateState = (newState) => {
    this.setState(newState);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.requestCount !== this.state.requestCount && this.state.measurementStarted) {
      if (this.state.requestCount != 0) {
        this.sendMessage(3);
      }
    }
  }

  sendMessage = (mode) => {
    const { currentDevice, deviceConnectionInfo } = this.state;
    const { id } = currentDevice;
    const deviceConnectionRead = ["e093f3b5-00a3-a9e5-9eca-40016e0edc24", "e093f3b6-00a3-a9e5-9eca-40026e0edc24"];

    // let resp = BleManager.write(id, ...deviceConnectionInfo, stringToBytes(this.state.writeMessage));
    let resp
    //enviromental sensor request
    if (mode == 1) {
      resp = BleManager.write(id, ...deviceConnectionInfo, stringToBytes("E/EV/D"));
    }
    //gyroscope request
    if (mode == 2) {
      resp = BleManager.write(id, ...deviceConnectionInfo, stringToBytes("G/AO/AR"));
    }
    //accelometer request
    if (mode == 3) {
      resp = BleManager.write(id, ...deviceConnectionInfo, stringToBytes("A/AO/A"));
    }
    const self = this;

    resp.then(
      function (value) {
        BleManager.read(id, ...deviceConnectionRead)
          .then((readData) => {
            const buffer = Buffer.from(readData); //https://github.com/feross/buffer#convert-arraybuffer-to-buffer
            if (mode == 1) {
              console.log(buffer.toString());
              self.state.dbManager.insertEnvData(buffer.toString(), self.state, self.handleUpdateState);
            }
            if (mode == 2) {
              console.log("mode 2");
              console.log(buffer.toString());
              self.setState({ lastGyro: buffer.toString() });
              self.setState({ requestCount: self.state.requestCount + 1 });
            }
            if (mode == 3) {
              console.log("id: " + self.state.lastEnvId + " ," + self.state.lastGyro + " " + buffer.toString())
              self.state.dbManager.insertMovmentData(self.state.lastGyro, buffer.toString(), self.state);
            }
          })
          .catch((error) => {
            console.log(error);
          });
      },
      function (error) {
        console.log("error", error);
      }
    );
  }

  getMessage = () => {
    const { currentDevice, deviceConnectionInfo } = this.state;
    const { id } = currentDevice;
    BleManager.read(id, ...deviceConnectionInfo)
      .then((readData) => {
        const buffer = Buffer.from(readData); //https://github.com/feross/buffer#convert-arraybuffer-to-buffer
        alert(buffer.toString())
      })
      .catch((error) => {
        alert(error);
      });
  }

  componentDidMount() {
    console.log('bluetooth scanner mounted');

    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      ).then((result) => {
        if (result) {
          console.log('Permission is OK');
        } else {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          ).then((result_) => {
            if (result_) {
              console.log('User accept');
            } else {
              console.log('User refuse');
            }
          });
        }
      });
    }

    NativeAppEventEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      (device) => {
        if (
          !this.state.devices.find(
            (stateDevice) => stateDevice.id === device.id
          )
        ) {
          this.state.devices.push(device);
          this.setState({ devices: [...this.state.devices] });
        }
      }
    );

    BleManager.start({ showAlert: false }).then(() => {
      // Success code
      console.log('Module initialized');
    });
  }

  startInterval = () => {
    const id = setInterval(() => {
      console.log("Interval");
    }, 1000);
    this.setState({ intervalId: id });
  }

  stopInterval = () => {
    clearInterval(this.state.intervalId);
    this.setState({ intervalId: null });
    clearInterval(this.state.interval2Id);
    this.setState({ interval2Id: null });
    console.log("interval cleared");
  }

  startNewMeasurement = () => {
    KeepAwake.activate();
    this.setState({ requestCount: 0 });
    this.setState({ measurementStarted: true });
    this.sendMessage(1);
    const id = setInterval(() => {
      if (this.state.requestCount == 10) {
        this.sendMessage(1);
        console.log("deleted count");
        this.setState({ requestCount: 0 });;
      }
      else {
        this.sendMessage(2);
      }
    }, 500);
    this.setState({ intervalId: id });
    console.log("at start: " + this.state.measurementNumber);
    // interval for GPS location
    const id2 = setInterval(() => {
      this.getLocation();
    }, 2500);
    this.setState({ interval2Id: id2 });
  }

  stopMeasurement = () => {
    KeepAwake.deactivate();
    this.stopInterval()
    this.setState({ measurementStarted: false });
    this.setState({ measurementNumber: this.state.measurementNumber + 1 });
  }

  pauseMeasurement = () => {
    KeepAwake.deactivate();
    this.stopInterval()
    this.setState({ measurementPaused: true });
  }

  continueMeasurement = () => {
    KeepAwake.activate();
    this.setState({ requestCount: 0 });
    this.sendMessage(1);
    const id = setInterval(() => {
      if (this.state.requestCount == 10) {
        this.sendMessage(1);
        console.log("deleted count");
        this.setState({ requestCount: 0 });;
      }
      else {
        this.sendMessage(2);
      }
    }, 500);
    this.setState({ intervalId: id });
    this.setState({ measurementPaused: false });

    const id2 = setInterval(() => {
      this.getLocation();
    }, 2500);
    this.setState({ interval2Id: id2 });
  }

  getLocation = () => {
    self = this;
    Geolocation.getCurrentPosition(
      position => {
        self.setState({ location: position });
      },
      error => {
        self.setState({ location: null });
      },
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 500 },
    );
    console.log(this.state.location);
  }

  render() {
    return (
      <SafeAreaView style={{ padding: 50 }}>
        <ScrollView>
          {!this.state.currentDevice ? (
            <ConnectionHandlers bleManager={BleManager} updateState={this.handleUpdateState} devicesState={this.state.devices} />
          ) : (
            <>
              {!this.state.measurementStarted ? (
                <Button
                  title={"Start measurement"}
                  onPress={this.startNewMeasurement}
                />
              ) : (
                <>
                  <Button
                    title={"Stop measurement"}
                    onPress={this.stopMeasurement}
                  />
                  {!this.state.measurementPaused ? (
                    <>
                      <Button
                        title={"Pause measurement"}
                        onPress={this.pauseMeasurement}
                      />
                      <Text>{`Measurement in progress`}</Text>
                    </>
                  ) : (
                    <>
                      <Button
                        title={"Continue measurement"}
                        onPress={this.continueMeasurement}
                      />
                      <Text>{`Measurement paused`}</Text>
                    </>
                  )}
                </>
              )}
              <Text>{`Connected to: ${this.state.currentDevice.id}`}</Text>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }
}
