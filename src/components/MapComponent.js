import React from 'react';
import { Text, Button, SafeAreaView, View} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { LatLng, LeafletView, MapShapeType } from 'react-native-leaflet-view';


class MapComponent extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isInternet: false,
            centerPos: this.setCenterPos(), 
        }

        NetInfo.fetch().then(state => {
            if (state.isConnected) {
                this.setState({ isInternet: true });
            }
        });

        let posNum = this.props.gpsData.length;
        if(posNum != 0){
            let center = Math.floor((posNum)/2);
            this.setState({centerPos: this.props.gpsData[center]});
        }
        
    }

    setCenterPos = ()=> {
        let posNum = this.props.gpsData.length;
        if(posNum != 0){
            let center = Math.floor((posNum)/2);
            console.log(this.props.gpsData[center]);
            return this.props.gpsData[center];
        }
        else{
            console.log({lat: 48.14816, lng: 17.10674});
            return {lat: 48.14816, lng: 17.10674};
        }
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
                    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <LeafletView
                            mapMarkers={[
                                {
                                    position: {
                                        lat: 37.78825,
                                        lng: -122.4324,
                                    },
                                    icon: '📍',
                                    size: [32, 32],
                                },
                            ]}
                            // mapShapes={[
                            //     {
                            //         shapeType: MapShapeType.POLYLINE,
                            //         color: "red",
                            //         id: "6",
                            //         positions: this.state.points
                            //     }
                            // ]}
                            mapCenterPosition={this.state.centerPos}
                            zoom={14}
                            doDebug={false}
                        />
                    </SafeAreaView>
                )}
            </>
        );
    }
}

export default MapComponent;