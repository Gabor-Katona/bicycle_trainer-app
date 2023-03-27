import React, { Component } from 'react';
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
import { stringToBytes } from "convert-string";
import { Buffer } from "buffer";

import { getServiceAndCharacteristics } from "./uitls"

// I changed this to export default App
export default class App extends Component {
  state = {
    devices: [],
    connectedDevice: null,
    deviceConnectionInfo: [],
    writeMessage: "",
    readMessage: "",
    intervalId: null,
    startTime: 0,
  };

  sendMessage = () => {
    const { currentDevice, deviceConnectionInfo } = this.state;
    const { id } = currentDevice;

    const deviceConnectionRead = ["e093f3b5-00a3-a9e5-9eca-40016e0edc24", "e093f3b6-00a3-a9e5-9eca-40026e0edc24"];
    //let resp = BleManager.write(id, ...deviceConnectionInfo, stringToBytes(this.state.writeMessage));
    let resp = BleManager.write(id, ...deviceConnectionInfo, stringToBytes("E/EV/D"));

    resp.then(
      function (value) {
        BleManager.read(id, ...deviceConnectionRead)
          .then((readData) => {
            const buffer = Buffer.from(readData);   //https://github.com/feross/buffer#convert-arraybuffer-to-buffer
            //alert(buffer.toString())
            console.log(buffer.toString());
          })
          .catch((error) => {
            alert(error);
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
          .then(() => {
            const id = setInterval(() => {
              
              let now = new Date().getTime();
              console.log(now - this.state.startTime );
              this.sendMessage()
              this.setState({ startTime: now });

            }, 250);
            this.setState({ intervalId: id });
          });
        })
        .catch((error) => alert(`Error: ${error}`));
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
    console.log("interval cleared");
  }

  render() {
    return (
      <SafeAreaView style={{ padding: 50 }}>
        <ScrollView>
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
          <Button
            onPress={() => this.stopInterval()}
            title="Stop Interval"
            style={{ marginBottom: 5 }}
          />

          {!this.state.currentDevice ? (
            this.state.devices.map((device) => (
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
            )
            )) : (
            <>
              <Button
                title={"Get a message"}
                onPress={this.getMessage}
              />
              <Button
                title={"Send a message"}
                onPress={this.sendMessage}
              />
              <Text>{`Connected to: ${this.state.currentDevice.id}`}</Text>
              <TextInput
                onChangeText={(writeMessage) =>
                  this.setState({ writeMessage })
                }
                value={this.state.writeMessage}
              />
              <Text>{`Message received: ${this.state.readMessage}`}</Text>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }
}
