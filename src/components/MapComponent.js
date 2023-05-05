import React from 'react';
import { Text, Button, TouchableOpacity, View, Dimensions, ScrollView, ToastAndroid } from "react-native";
import NetInfo from "@react-native-community/netinfo";


class MapComponent extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isInternet: false,
        }

        NetInfo.fetch().then(state => {
            if (state.isConnected) {
                this.setState({ isInternet: true });
            }
        });

    }

    goBack = () => {
        this.props.updateState({ showMap: false });
    }

    refresh = () => {
        NetInfo.fetch().then(state => {
            if (state.isConnected) {
                this.setState({ isInternet: true });
            }
        })
    }

    render() {
        return (
            <>
                <View style={{ paddingHorizontal: 50, paddingVertical: 10 }}>
                    <Button
                        title={"Go back"}
                        onPress={this.goBack}
                    />
                </View>
                {!this.state.isInternet ? (
                    <View style={{ paddingHorizontal: 50, paddingVertical: 10 }}>
                        <Text style={{ paddingVertical: 30, color: "black", textAlign: 'center', fontWeight: 'bold' }}>Please connect to internet</Text>
                        <Button
                            title={"Refresh"}
                            onPress={this.refresh}
                        />
                    </View>
                ) : (
                    <Text>Map</Text>
                )}
            </>
        );
    }
}

export default MapComponent;