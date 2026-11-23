
package lk.ac.uom.campuspulse.udp;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;

public class UdpSender {

    public static void main(String[] args) {

        final int SERVER_PORT = 6001;

        String[] messages = {
            "SENSOR|B201|TEMP|36.8|1700",
            "SENSOR|A102|TEMP|29.5|1701",
            "SENSOR|C305|TEMP|32.1|1702"
        };

        try (DatagramSocket socket = new DatagramSocket()) {

            InetAddress serverAddress =
                    InetAddress.getByName("localhost");

            for (String message : messages) {

                byte[] data = message.getBytes(StandardCharsets.UTF_8);

                DatagramPacket packet = new DatagramPacket(
                        data,
                        data.length,
                        serverAddress,
                        SERVER_PORT
                );

                socket.send(packet);

                System.out.println("Sensor message sent: " + message);
            }

        } catch (Exception e) {
            System.err.println("Sender error: " + e.getMessage());
        }
    }
}
