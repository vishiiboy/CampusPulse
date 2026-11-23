
package lk.ac.uom.campuspulse.udp;

public class SensorMessageValidator {

    public static boolean isValid(String message) {

        if (message == null || message.isBlank()) {
            return false;
        }

        String[] fields = message.split("\\|", -1);

        if (fields.length != 5) {
            return false;
        }

        if (!fields[0].equals("SENSOR")) {
            return false;
        }

        if (!fields[1].matches("[A-Z][0-9]{3}")) {
            return false;
        }

        if (!fields[2].equals("TEMP")) {
            return false;
        }

        try {
            double temperature = Double.parseDouble(fields[3]);

            if (!Double.isFinite(temperature)
                    || temperature < -50
                    || temperature > 100) {
                return false;
            }

            long timestamp = Long.parseLong(fields[4]);

            if (timestamp <= 0) {
                return false;
            }

        } catch (NumberFormatException e) {
            return false;
        }

        return true;
    }
}
