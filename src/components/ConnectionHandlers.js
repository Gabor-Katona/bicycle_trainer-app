import React from 'react';
import { Text, Button, TouchableOpacity, ScrollView } from "react-native";

import { getServiceAndCharacteristics } from "./../../uitls"

class ConnectionHandlers extends React.Component {
    constructor(props) {
        super(props);
    }

    startScanning() {
        console.log('start scanning');
        this.props.bleManager.scan([], 12);
    }

    connectToDevice = (device) => {
        if (device.advertising.isConnectable) {
            this.props.bleManager.connect(device.id)
                .then(() => {
                    this.props.updateState({ currentDevice: device });

                    this.props.bleManager.retrieveServices(device.id).then((peripheralInfo) => {
                        this.props.updateState({
                            deviceConnectionInfo:
                                getServiceAndCharacteristics(peripheralInfo),
                        });
                    })
                })
                .catch((error) => (`Error: ${error}`));
        } else {
            alert('Device is not connectable');
        }
    }

    render() {
        return (
            <ScrollView>
                <Text>Bluetooth scanner</Text>
                <Button
                    onPress={() => this.startScanning()}
                    title="Start scanning"
                    style={{ marginBottom: 5 }}
                />
                <Button
                    onPress={() => this.props.bleManager.stopScan()}
                    title="Stop scanning"
                    style={{ marginBottom: 5 }}
                />
                {this.props.devicesState.map((device) => (
                    <TouchableOpacity
                        style={{ padding: 10, margin: 5, backgroundColor: '#cccbcb' }}
                        key={device.id}
                        onPress={() => this.connectToDevice(device)}
                    >
                        <Text>{`${device.id}: ${device.advertising.isConnectable
                            ? 'connectable'
                            : 'not connectable'
                            }`}
                        </Text>
                    </TouchableOpacity>
                ))
                }
            </ScrollView>
        );
    }
}

export default ConnectionHandlers;