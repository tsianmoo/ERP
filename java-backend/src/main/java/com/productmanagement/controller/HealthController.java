package com.productmanagement.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * 健康检查控制器
 * 提供服务状态、数据库连接等信息
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HealthController {

    private final DataSource dataSource;

    @Value("${spring.application.name:product-management-backend}")
    private String applicationName;

    @Value("${server.port:8080}")
    private String serverPort;

    /**
     * 简单的健康检查端点
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        health.put("service", applicationName);
        health.put("port", serverPort);
        return ResponseEntity.ok(health);
    }

    /**
     * 详细状态检查端点
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        status.put("service", applicationName);
        status.put("port", serverPort);

        // 数据库状态
        Map<String, Object> dbStatus = new HashMap<>();
        try {
            var connection = dataSource.getConnection();
            dbStatus.put("status", "UP");
            dbStatus.put("database", connection.getCatalog());
            dbStatus.put("url", connection.getMetaData().getURL().replaceAll("password=[^&]*", "password=***"));
            connection.close();
        } catch (SQLException e) {
            dbStatus.put("status", "DOWN");
            dbStatus.put("error", e.getMessage());
            status.put("status", "DOWN");
        }
        status.put("database", dbStatus);

        // JVM 信息
        Map<String, Object> jvm = new HashMap<>();
        Runtime runtime = Runtime.getRuntime();
        jvm.put("maxMemory", formatBytes(runtime.maxMemory()));
        jvm.put("totalMemory", formatBytes(runtime.totalMemory()));
        jvm.put("freeMemory", formatBytes(runtime.freeMemory()));
        jvm.put("usedMemory", formatBytes(runtime.totalMemory() - runtime.freeMemory()));
        jvm.put("availableProcessors", runtime.availableProcessors());
        status.put("jvm", jvm);

        return ResponseEntity.ok(status);
    }

    /**
     * 存活探针
     */
    @GetMapping("/liveness")
    public ResponseEntity<Map<String, Object>> liveness() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        return ResponseEntity.ok(response);
    }

    /**
     * 就绪探针
     */
    @GetMapping("/readiness")
    public ResponseEntity<Map<String, Object>> readiness() {
        Map<String, Object> response = new HashMap<>();
        
        // 检查数据库连接
        try {
            var connection = dataSource.getConnection();
            connection.close();
            response.put("status", "UP");
            response.put("database", "connected");
            return ResponseEntity.ok(response);
        } catch (SQLException e) {
            response.put("status", "DOWN");
            response.put("database", "disconnected");
            response.put("error", e.getMessage());
            return ResponseEntity.status(503).body(response);
        }
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "B";
        return String.format("%.1f %s", bytes / Math.pow(1024, exp), pre);
    }
}
