
package lk.ac.uom.campuspulse.udp;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.nio.charset.StandardCharsets;

public class UdpReceiver {

    public static void main(String[] args) {

        final int PORT = 6001;

        try (DatagramSocket socket = new DatagramSocket(PORT)) {

            System.out.println("CampusPulse UDP Receiver Started");
            System.out.println("Listening on port " + PORT);
            System.out.println("Waiting for sensor messages...\n");

            byte[] buffer = new byte[1024];

            while (true) {

                DatagramPacket packet =
                        new DatagramPacket(buffer, buffer.length);

                socket.receive(packet);

                String message = new String(
                        packet.getData(),
                        packet.getOffset(),
                        packet.getLength(),
                        StandardCharsets.UTF_8
                );

                System.out.println("\nReceived: " + message);

                if (SensorMessageValidator.isValid(message)) {

                    System.out.println("Status: VALID");
                    System.out.println("Sensor message accepted.");

                    String[] fields = message.split("\\|");

                    String roomId = fields[1];
                    double temperature = Double.parseDouble(fields[3]);

                    if (TemperatureRule.isHighTemperature(temperature)) {
                        System.out.println("ALERT: High temperature detected in room "
                                 + roomId + " (" + temperature + "°C)");
                    } else {
                        System.out.println("Temperature is normal in room " + roomId);
                    }

                }else {        

                    System.out.println("Status: INVALID");
                    System.out.println("Sensor message rejected.");
                }
            }

        } catch (Exception e) {
            System.err.println("Receiver error: " + e.getMessage());
        }
    }
}
