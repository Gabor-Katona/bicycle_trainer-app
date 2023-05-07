import React from 'react';
import { Text, Button, SafeAreaView, View, TouchableWithoutFeedback, Image, Animated, Easing } from "react-native";


class AnimateInclination extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            // toValue: 1,
            // duration: 0,
            // degData: ["0deg", "0deg"],
            // animRange: [0, 1],
            toValue: this.calcValue(),
            duration: this.calcDuration(),
            degData: this.calcDegData(),
            animRange: this.calcRange(),
        }

        this.rotateValue = new Animated.Value(0);
    }

    calcValue = () => {
        return this.props.gyro.length;
    }

    calcDuration = () => {
        return this.props.gyro.length * 150;
    }

    calcDegData = () => {
        var len = this.props.gyro.length;
        var degdata = []
        for (let i = 0; i < len; i++) {
            degdata.push(this.props.gyro[i] + "deg");
        }
        return degdata;
    }

    calcRange = () => {
        var len = this.props.gyro.length;
        var range = []
        for (let i = 0; i < len; i++) {
            range.push(i);
        }
        return range;
    }

    goBack = () => {
        this.props.updateState({ showAnim: false });
        this.props.updateState({ showMap: false });
    }

    render() {
        let rotation = this.rotateValue.interpolate({
            inputRange: this.state.animRange,
            outputRange: this.state.degData // degree of rotation
        });


        let transformStyle = { transform: [{ rotate: rotation }], alignItems: 'center', paddingTop: 20 };
        return (
            <>
                <View style={{ paddingHorizontal: 50, paddingVertical: 10 }}>
                    <Button
                        title={"Go back"}
                        onPress={this.goBack}
                    />
                </View>
                <View style={{ paddingLeft: 5 }}>
                    <Text>Tap on bicycle to animate</Text>
                    <Text>Hold the bicycle to reload animation</Text>
                </View>
                <TouchableWithoutFeedback
                    onPressIn={() => {
                        Animated.timing(this.rotateValue, {
                            toValue: this.state.toValue,
                            duration: this.state.duration,
                            easing: Easing.linear,
                            useNativeDriver: true
                        }).start();
                    }}
                    onLongPress={() => {
                        Animated.timing(this.rotateValue, {
                            toValue: 0,
                            duration: 1,
                            easing: Easing.linear,
                            useNativeDriver: true
                        }).start();
                    }}
                >
                    <Animated.View style={transformStyle}>
                        <Image source={require('./../assets/bicycle.png')} style={{ width: 270, height: 370, }} />
                    </Animated.View>
                </TouchableWithoutFeedback>
            </>
        );
    }

}

export default AnimateInclination;