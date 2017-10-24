function mySettings(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">Blue Marble Settings</Text>}>
        <Select
          label="Display"
          settingsKey="display"
          options={[
            { name: "Living Earth", value: 0 },
            { name: "NASA Blue Marble", value: 1 },
            { name: "NASA Visible Earth", value: 2 },
            { name: "topo map", value: 3 },
            { name: "clouds", value: 4 },
            { name: "IR clouds", value: 5 },
            { name: "color weather", value: 6 },
            { name: "water vapor", value: 7 }
          ]} />
        <Select
          label="Viewpoint"
          settingsKey="viewpoint"
          options={[
            { name: "GPS", value: 0 },
            { name: "sun", value: 1 },
            { name: "moon", value: 2 }
          ]} />
        <Select
          label="Day/Night"
          settingsKey="daynight"
          options={[
            { name: "show night", value: 0 },
            { name: "hide night", value: 1 }
          ]} />
        <Select
          label="Altitude"
          settingsKey="altitude"
          options={[
            { name: "high", value: 0 },
            { name: "medium", value: 1 },
            { name: "low", value: 2 }
          ]} />
        <Select
          label="Zoom"
          settingsKey="zoom"
          options={[
            { name: "normal", value: 0 },
            { name: "a little", value: 1 },
            { name: "a lot", value: 2 }
          ]} />
        <Select
          label="Refresh"
          settingsKey="refresh"
          options={[
            { name: "Hourly", value: 0 },
            { name: "30 Minutes", value: 1 },
            { name: "15 Minutes", value: 2 },
            { name: "Never", value: 3 }
          ]} />
        <Select
          label="Date"
          settingsKey="date"
          options={[
            { name: "Day Mon D", value: 0 },
            { name: "Day D Mon", value: 1 },
            { name: "Month D", value: 2 },
            { name: "D Month", value: 3 },
            { name: "M/D/Y", value: 4 },
            { name: "D/M/Y", value: 5 },
            { name: "M-D-Y", value: 6 },
            { name: "D-M-Y", value: 7 },
            { name: "hide", value: 8 }
          ]} />
        <Select
          label="Tap"
          settingsKey="tap"
          options={[
            { name: "ignore", value: 0 },
            { name: "cycle display", value: 1 },
            { name: "cycle 3 displays", value: 2 }
          ]} />
        <Select
          label="Vibration"
          settingsKey="vibration"
          options={[
            { name: "none", value: 0 },
            { name: "hourly", value: 1 }
          ]} />
        <Select
          label="Battery"
          settingsKey="battery"
          options={[
            { name: "hide", value: 0 },
            { name: "show", value: 1 },
            { name: "show if low", value: 2 }
          ]} />
      </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);
