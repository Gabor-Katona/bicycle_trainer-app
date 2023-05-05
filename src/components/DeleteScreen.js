import React from 'react';
import { Text, Button, TouchableOpacity, View, Dimensions, ScrollView, ToastAndroid } from "react-native";



class DeleteScreen extends React.Component {

    constructor(props) {
        super(props);

    }

    deleteAll = () => {
        this.props.dbManager.dropTables();
        this.props.dbManager.createTables();
        this.props.updateState({deleteMode: false});
    }

    goBack = () => {
        this.props.updateState({deleteMode: false});
    }

    render() {
        return (
            <View style={{ padding: 50 }}>
                <Text style={{ color: "black", textAlign: 'center', fontWeight: 'bold', fontSize: 25 }}>Do you want to delete all measured data?</Text>
                <View style={{ paddingVertical: 5 }}>
                    <Button
                        title={"No"}
                        onPress={this.goBack}
                    />
                </View>
                <Button
                    title={"Yes"}
                    onPress={this.deleteAll}
                />
            </View>
        );
    }
}

export default DeleteScreen;