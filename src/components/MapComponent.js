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
            startPos: this.setStartPos(),
            markerSize: this.setMarkerSize(),
        }

        NetInfo.fetch().then(state => {
            if (state.isConnected) {
                this.setState({ isInternet: true });
            }
        });

    }

    setCenterPos = ()=> {
        let posNum = this.props.gpsData.length;
        if(posNum != 0){
            let center = Math.floor((posNum)/2);
            return this.props.gpsData[center];
        }
        else{
            return {lat: 48.14816, lng: 17.10674};
        }
    }

    setStartPos = ()=> {
        if(this.props.gpsData.length != 0){
            return this.props.gpsData[0];
        }
        else{
            return {lat: 0, lng: 0};
        }
    }

    setMarkerSize = ()=> {
        if(this.props.gpsData.length != 0){
            return [10, 10];
        }
        else{
            return [0, 0];
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
                                    position: this.state.startPos,
                                    //icon: '📍',
                                    icon: 'Start',
                                    size: this.state.markerSize,
                                },
                            ]}
                            mapShapes={[
                                {
                                    shapeType: MapShapeType.POLYLINE,
                                    color: "red",
                                    id: "6",
                                    positions: this.props.gpsData
                                }
                            ]}
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