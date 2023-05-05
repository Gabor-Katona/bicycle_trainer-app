import React from 'react';
import { Text, Button, TouchableOpacity, View, Dimensions, ScrollView, ToastAndroid } from "react-native";
import SelectDropdown from 'react-native-select-dropdown';
import { LineChart } from "react-native-chart-kit";


class DataVisualizer extends React.Component {
    chartConf = {
        backgroundColor: '#FAFAFA',
        backgroundGradientFrom: '#FAFAFA',
        backgroundGradientTo: '#FAFAFA',
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        propsForDots: {
            r: "2",
            strokeWidth: "2",
        }
    };

    constructor(props) {
        super(props);

        this.state = {
            waitData: false,
            showData: false,
            temperature: [0],
            humidity: [0],
            pressure: [0],
            gyroX: [],
            gyroY: [],
            gyroZ: [],
            accelX: [],
            accelY: [0],
            accelZ: [],
            date: [""],
            gps: [],
            measurementNum: [],
            day: 0,
            altitude: [0],
            speed: [0]
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
        console.log(this.state.altitude);
    }

    selectedMeasurementNumber = (number) => {
        this.props.dbManager.getMeasurementByNumber(this.handleUpdateState, parseInt(number));
    }

    showMap = () => {
        console.log("show map");
    }

    render() {
        return (
            <>
                <ScrollView >
                    <View style={{ paddingHorizontal: 50, paddingVertical: 10 }}>
                        <Button
                            title={"Go back"}
                            onPress={this.backToMeasurement}
                        />

                        <SelectDropdown buttonStyle={{ marginTop: 10, width: '100%' }}
                            data={this.state.measurementNum}
                            onSelect={(selectedItem, index) => {
                                this.setState({ showData: false })
                                this.setState({ waitData: true })
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
                    {this.state.waitData &&
                        <Text style={{ paddingTop: 70, color: "black", textAlign: 'center', fontWeight: 'bold', fontSize: 20 }}>Please wait</Text>
                    }
                    {this.state.showData &&
                        <>
                            <View style={{ paddingHorizontal: 50}}>
                                <Button
                                    title={"Show map"}
                                    onPress={this.showMap}
                                />
                            </View>
                            <Text style={{ marginLeft: 10, color: "black" }}>Measurement date: {this.state.day}</Text>
                            <View >
                                <Text style={{ marginLeft: 10, color: "black", fontWeight: "bold" }}>Temperature:</Text>
                                <LineChart
                                    data={{
                                        labels: this.state.date,
                                        datasets: [
                                            {
                                                data: this.state.temperature
                                            }
                                        ]
                                    }}
                                    width={Dimensions.get("window").width} // from react-native
                                    height={400}
                                    yAxisSuffix="°C"
                                    withVerticalLines={false}
                                    verticalLabelRotation={70}
                                    xLabelsOffset={-15}
                                    chartConfig={this.chartConf}
                                    onDataPointClick={(value) => {
                                        ToastAndroid.showWithGravityAndOffset(
                                            value.value.toString() + "°C",
                                            ToastAndroid.SHORT,
                                            ToastAndroid.BOTTOM,
                                            25, 50,
                                        );
                                    }}
                                />
                            </View>
                            <View >
                                <Text style={{ marginLeft: 10, color: "black", fontWeight: "bold" }}>Humidity:</Text>
                                <LineChart
                                    data={{
                                        labels: this.state.date,
                                        datasets: [
                                            {
                                                data: this.state.humidity
                                            }
                                        ]
                                    }}
                                    width={Dimensions.get("window").width} // from react-native
                                    height={400}
                                    yAxisSuffix="%"
                                    withVerticalLines={false}
                                    verticalLabelRotation={70}
                                    xLabelsOffset={-10}
                                    chartConfig={this.chartConf}
                                    onDataPointClick={(value) => {
                                        ToastAndroid.showWithGravityAndOffset(
                                            value.value.toString() + "%",
                                            ToastAndroid.SHORT,
                                            ToastAndroid.BOTTOM,
                                            25, 50,
                                        );
                                    }}
                                />
                            </View>
                            <View >
                                <Text style={{ marginLeft: 10, color: "black", fontWeight: "bold" }}>Pressure:</Text>
                                <LineChart
                                    data={{
                                        labels: this.state.date,
                                        datasets: [
                                            {
                                                data: this.state.pressure
                                            }
                                        ]
                                    }}
                                    width={Dimensions.get("window").width} // from react-native
                                    height={400}
                                    yAxisSuffix="Pa"
                                    withVerticalLines={false}
                                    verticalLabelRotation={70}
                                    xLabelsOffset={-10}
                                    yLabelsOffset={5}
                                    chartConfig={this.chartConf}
                                    onDataPointClick={(value) => {
                                        ToastAndroid.showWithGravityAndOffset(
                                            value.value.toString() + "Pa",
                                            ToastAndroid.SHORT,
                                            ToastAndroid.BOTTOM,
                                            25, 50,
                                        );
                                    }}
                                />
                            </View>
                            <View >
                                <Text style={{ marginLeft: 10, color: "black", fontWeight: "bold" }}>Altitude:</Text>
                                <LineChart
                                    data={{
                                        labels: this.state.date,
                                        datasets: [
                                            {
                                                data: this.state.altitude
                                            }
                                        ]
                                    }}
                                    width={Dimensions.get("window").width} // from react-native
                                    height={400}
                                    yAxisSuffix="m"
                                    withVerticalLines={false}
                                    verticalLabelRotation={70}
                                    xLabelsOffset={-10}
                                    chartConfig={this.chartConf}
                                    onDataPointClick={(value) => {
                                        ToastAndroid.showWithGravityAndOffset(
                                            value.value.toString() + "m",
                                            ToastAndroid.SHORT,
                                            ToastAndroid.BOTTOM,
                                            25, 50,
                                        );
                                    }}
                                />
                            </View>
                            <View >
                                <Text style={{ marginLeft: 10, color: "black", fontWeight: "bold" }}>Speed:</Text>
                                <LineChart
                                    data={{
                                        labels: this.state.date,
                                        datasets: [
                                            {
                                                data: this.state.speed
                                            }
                                        ]
                                    }}
                                    width={Dimensions.get("window").width} // from react-native
                                    height={400}
                                    yAxisSuffix="km/h"
                                    withVerticalLines={false}
                                    verticalLabelRotation={70}
                                    xLabelsOffset={-10}
                                    yLabelsOffset={5}
                                    chartConfig={this.chartConf}
                                    onDataPointClick={(value) => {
                                        ToastAndroid.showWithGravityAndOffset(
                                            value.value.toString() + "km/h",
                                            ToastAndroid.SHORT,
                                            ToastAndroid.BOTTOM,
                                            25, 50,
                                        );
                                    }}
                                />
                            </View>
                            <View >
                                <Text style={{ marginLeft: 10, color: "black", fontWeight: "bold" }}>Forward acceleration:</Text>
                                <LineChart
                                    data={{
                                        labels: this.state.date,
                                        datasets: [
                                            {
                                                data: this.state.accelY
                                            }
                                        ]
                                    }}
                                    width={Dimensions.get("window").width} // from react-native
                                    height={400}
                                    yAxisSuffix="m/s^2"
                                    withVerticalLines={false}
                                    verticalLabelRotation={70}
                                    xLabelsOffset={-10}
                                    yLabelsOffset={5}
                                    chartConfig={this.chartConf}
                                    onDataPointClick={(value) => {
                                        ToastAndroid.showWithGravityAndOffset(
                                            value.value.toString() + "m/s^2",
                                            ToastAndroid.SHORT,
                                            ToastAndroid.BOTTOM,
                                            25, 50,
                                        );
                                    }}
                                />
                            </View>
                        </>
                    }
                </ScrollView>
            </>
        );
    }
}

export default DataVisualizer;