import React from 'react';
import { Text, Button, TouchableOpacity } from "react-native";
import KeepAwake from 'react-native-keep-awake';


class PauseStopComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    stopInterval = () => {
        clearInterval(this.props.state.intervalId);
        this.props.updateState({ intervalId: null });
        clearInterval(this.props.state.interval2Id);
        this.props.updateState({ interval2Id: null });
        console.log("interval cleared");
    }

    stopMeasurement = () => {
        KeepAwake.deactivate();
        this.stopInterval()
        setTimeout(() => {}, 600)
        this.props.updateState({ measurementStarted: false });
        this.props.updateState({ measurementNumber: this.props.state.measurementNumber + 1 });
        this.props.updateState({ showMeasurementNum: false });
    }

    pauseMeasurement = () => {
        KeepAwake.deactivate();
        this.stopInterval()
        this.props.updateState({ measurementPaused: true });
    }

    continueMeasurement = () => {
        KeepAwake.activate();
        this.props.updateState({ requestCount: 0 });
        this.props.sendMessage(1);
        const id = setInterval(() => {
            if (this.props.state.requestCount == 10) {
                this.props.sendMessage(1);
                console.log("deleted count");
                this.props.updateState({ requestCount: 0 });;
            }
            else {
                this.props.sendMessage(2);
            }
        }, 500);
        this.props.updateState({ intervalId: id });
        this.props.updateState({ measurementPaused: false });

        const id2 = setInterval(() => {
            this.props.getLocation();
        }, 2500);
        this.props.updateState({ interval2Id: id2 });
    }


    render() {
        return (
            <>
                <Button
                    title={"Stop measurement"}
                    onPress={this.stopMeasurement}
                />
                {!this.props.state.measurementPaused ? (
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
        );
    }
}

export default PauseStopComponent;