export const getServiceAndCharacteristics = (peripheralInfo) => {
    const characteristics = peripheralInfo.characteristics;
    const characteristic = characteristics.find((characteristic) => characteristic.properties.Write === "Write" && characteristic.properties.Read === "Read");

    if (!characteristic) {
        alert(`Error: no characteristic found`)
        return;
    }

    return [characteristic.service, characteristic.characteristic]
}