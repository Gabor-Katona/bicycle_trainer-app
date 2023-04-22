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
import SQLite from 'react-native-sqlite-storage';
import Geolocation from 'react-native-geolocation-service';
import KeepAwake from 'react-native-keep-awake';
import { stringToBytes } from "convert-string";
import { Buffer } from "buffer";

import { getServiceAndCharacteristics } from "./uitls"

// I changed this to export default App
export default class App extends Component {

  constructor(props) {
    super(props);
    insertEnvData = (data) => this.insertEnvData(data);

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
    };

    db = SQLite.openDatabase(
      {
        name: 'MainDB',
        location: 'default',
      },
      () => { },
      error => { console.log(error) }
    );

    this.dropTables();
    this.createTable1();
    this.createTable2();
    this.createTable3();

    this.setMeasurmentNumber();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.requestCount !== this.state.requestCount && this.state.measurementStarted) {
      if (this.state.requestCount != 0) {
        this.sendMessage(3);
      }
    }
  }

  createTable1 = () => {
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS Enviromental "
        + "(Id	INTEGER NOT NULL UNIQUE, Temperature	INTEGER, Humidity	INTEGER, Air_quality INTEGER, Pressure INTEGER, "
        + "Latitude REAL, Longitude REAL, "
        + "PRIMARY KEY( Id AUTOINCREMENT));"
      )
    })
  }

  createTable2 = () => {
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS Movement "
        + "(Id	INTEGER NOT NULL UNIQUE, Gyroscope_x	INTEGER, Gyroscope_y	INTEGER, Gyroscope_z	INTEGER, "
        + "Accelerometer_x	INTEGER, Accelerometer_y	INTEGER, Accelerometer_z	INTEGER, "
        + "PRIMARY KEY( Id AUTOINCREMENT));"
        + "CREATE TABLE IF NOT EXISTS Time "
        + "(Enviromental_id	INTEGER, Movement_id	INTEGER, Time	TEXT, "
        + "FOREIGN KEY( Enviromental_id) REFERENCES Enviromental( Id ), "
        + "FOREIGN KEY( Movement_id) REFERENCES Movement( Id ), "
        + "PRIMARY KEY( Enviromental_id, Movement_id));"
      )
    })
  }

  createTable3 = () => {
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS Time "
        + "(Enviromental_id	INTEGER, Movement_id	INTEGER, Time	TEXT, Measurement_number INTEGER, "
        + "FOREIGN KEY( Enviromental_id) REFERENCES Enviromental( Id ), "
        + "FOREIGN KEY( Movement_id) REFERENCES Movement( Id ), "
        + "PRIMARY KEY( Enviromental_id, Movement_id));"
      )
    })
  }

  dropTables = () => {
    db.transaction((tx) => {
      tx.executeSql(
        "DROP TABLE Time;"
      )
    })
    db.transaction((tx) => {
      tx.executeSql(
        "DROP TABLE Movement;"
      )
    })
    db.transaction((tx) => {
      tx.executeSql(
        "DROP TABLE Enviromental;"
      )
    })
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
              this.insertEnvData(buffer.toString());
            }
            if (mode == 2) {
              console.log("mode 2");
              console.log(buffer.toString());
              self.setState({ lastGyro: buffer.toString() });
              self.setState({ requestCount: self.state.requestCount + 1 });
            }
            if (mode == 3) {
              console.log("id: " + self.state.lastEnvId + " ," + self.state.lastGyro + " " + buffer.toString())
              self.insertMovmentData(self.state.lastGyro, buffer.toString());
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

  startScanning() {
    console.log('start scanning');
    BleManager.scan([], 12);
  }

  connectToDevice(device) {
    if (device.advertising.isConnectable) {
      BleManager.connect(device.id)
        .then(() => {
          this.setState({ currentDevice: device });

          BleManager.retrieveServices(device.id).then((peripheralInfo) => {
            this.setState({
              deviceConnectionInfo:
                getServiceAndCharacteristics(peripheralInfo),
            });
          })
          /*.then(() => {
            this.sendMessage(1);
            const id = setInterval(() => {
              this.sendMessage(2);
            }, 500);
            this.setState({ intervalId: id });
          })*/
        })
        .catch((error) => (`Error: ${error}`));
    } else {
      alert('Device is not connectable');
    }
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

  insertEnvData = async (data) => {
    const self = this;
    if (data[0] === "E") {
      let parsed = data.slice(2).split(",");
      try {
        await db.transaction(async (tx) => {
          await tx.executeSql(
            "INSERT INTO Enviromental (Temperature, Humidity, Air_quality, Pressure, Latitude, "
            + "Longitude) VALUES (?,?,?,?,?,?)",
            [parseInt(parsed[0]), parseInt(parsed[1]), parseInt(parsed[2]), parseInt(parsed[3]),
              (self.state.location ? self.state.location.coords.latitude : null),
              (self.state.location ? self.state.location.coords.longitude : null)],
            (tx, results) => {
              console.log(results.insertId);
              this.setState({ lastEnvId: results.insertId });
            }
          );
        })
      } catch (error) {
        console.log(error);
      }
    }
  }

  insertMovmentData = async (gyroData, acceloData) => {
    if (gyroData[0] === "G" && acceloData[0] === "A") {
      let gyroParsed = gyroData.slice(2).split(",");
      let acceloParsed = acceloData.slice(2).split(",");
      try {
        await db.transaction(async (tx) => {
          await tx.executeSql(
            "INSERT INTO Movement (Gyroscope_x, Gyroscope_y, Gyroscope_z, "
            + "Accelerometer_x, Accelerometer_y, Accelerometer_z) VALUES (?,?,?,?,?,?)",
            [parseInt(gyroParsed[0]), parseInt(gyroParsed[1]), parseInt(gyroParsed[2]),
            parseInt(acceloParsed[0]), parseInt(acceloParsed[1]), parseInt(acceloParsed[2])],

            (tx, results) => {
              this.insertTimeData(this.state.lastEnvId, results.insertId);
            }
          );
        })
      } catch (error) {
        console.log(error);
      }
    }
  }

  insertTimeData = async (idEnviromental, idMovement) => {
    try {
      await db.transaction(async (tx) => {
        await tx.executeSql(
          "INSERT INTO Time (Enviromental_id, Movement_id, Time, Measurement_number ) VALUES (?,?,"
          + " STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW' ,'localtime'), ? )",
          [parseInt(idEnviromental), parseInt(idMovement), this.state.measurementNumber],
        );
      })
    } catch (error) {
      console.log(error);
    }
  }

  setMeasurmentNumber = async () => {
    const self = this;
    try {
      await db.transaction(async (tx) => {
        await tx.executeSql(
          "SELECT MAX(Measurement_number) AS Max FROM Time;",
          [],
          (tx, results) => {
            var len = results.rows.length;
            if (len > 0) {
              let max = results.rows.item(0).Max;
              if (max == null) {
                max = 0;
              }
              console.log("setMeasumentnum: " + (max + 1));
              self.setState({ measurementNumber: (max + 1) });
            }
          }
        );
      })
    } catch (error) {
      console.log(error);
    }
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
            <>
              <Text>Bluetooth scanner</Text>
              <Button
                onPress={() => this.startScanning()}
                title="Start scanning"
                style={{ marginBottom: 5 }}
              />
              <Button
                onPress={() => BleManager.stopScan()}
                title="Stop scanning"
                style={{ marginBottom: 5 }}
              />
              {this.state.devices.map((device) => (
                <TouchableOpacity
                  style={{ padding: 10, margin: 5, backgroundColor: '#cccbcb' }}
                  key={device.id}
                  onPress={() => this.connectToDevice(device)}
                >
                  <Text>{`${device.id}: ${device.advertising.isConnectable
                    ? 'connectable'
                    : 'not connectable'
                    }`}</Text>
                </TouchableOpacity>
              ))
              }
            </>
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
