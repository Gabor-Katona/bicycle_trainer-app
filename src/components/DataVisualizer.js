import React from 'react';
import { Text, Button, TouchableOpacity, View } from "react-native";
import SelectDropdown from 'react-native-select-dropdown';


class DataVisualizer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            temperature: [],
            humidity: [],
            pressure: [],
            gyroX: [],
            gyroY: [],
            gyroZ: [],
            accelX: [],
            accelY: [],
            accelZ: [],
            date: [],
            gps: [],
            measurementNum: [],
        }

        this.props.dbManager.getMeasurementByNumber(this.handleUpdateState);
        this.props.dbManager.getMeasurementNumbers(this.handleUpdateState);
        //console.log("num is:");
        //console.log(this.state.values);
    }

    handleUpdateState = (newState) => {
        this.setState(newState);
    }

    backToMeasurement = () => {
        this.props.updateState({ showDataMode: false });
        this.props.updateState({ measurementStarted: false });
    }

    show = () => {
        console.log(this.state.temperature);
        console.log(this.state.humidity);
        console.log(this.state.pressure);
        console.log(this.state.gyroX);
        console.log(this.state.gyroY);
        console.log(this.state.gyroZ);
        console.log(this.state.accelX);
        console.log(this.state.accelY);
        console.log(this.state.accelZ);
        console.log(this.state.date);
        console.log(this.state.gps);
    }

    selectedMeasurementNumber = (number) => { 
        this.props.dbManager.getMeasurementByNumber(this.handleUpdateState, parseInt(number));
    }

    render() {
        return (
            <>
                <View style={{ padding: 50 }}>
                    <Button
                        title={"Back to measurement"}
                        onPress={this.backToMeasurement}
                    />
                    <Button
                        title={"show"}
                        onPress={this.show}
                    />

                    <SelectDropdown buttonStyle={{ marginTop: 10, width: '100%' }}
                        data={this.state.measurementNum}
                        onSelect={(selectedItem, index) => {
                            console.log(selectedItem, index)
                            this.selectedMeasurementNumber(selectedItem);
                        }}

                        buttonTextAfterSelection={(selectedItem, index) => {
                            return selectedItem
                        }}
                        rowTextForSelection={(item, index) => {
                            return item
                        }}
                        defaultButtonText={'Select measurement'}
                        renderDropdownIcon={isOpened => {
                            return <Text style={{ fontSize: 22, paddingRight: 10 }}>˅</Text>;
                        }}
                        dropdownIconPosition={'right'}
                    />
                </View>
            </>
        );
    }
}

export default DataVisualizer;