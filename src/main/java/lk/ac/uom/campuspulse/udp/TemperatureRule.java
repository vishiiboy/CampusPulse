
package lk.ac.uom.campuspulse.udp;

public class TemperatureRule {

    private static final double ALERT_THRESHOLD = 35.0;

    public static boolean isHighTemperature(double temperature) {
        return temperature >= ALERT_THRESHOLD;
    }
}
