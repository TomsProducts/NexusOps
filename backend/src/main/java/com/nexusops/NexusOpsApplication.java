package com.nexusops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NexusOpsApplication {
    public static void main(String[] args) {
        SpringApplication.run(NexusOpsApplication.class, args);
    }
}
