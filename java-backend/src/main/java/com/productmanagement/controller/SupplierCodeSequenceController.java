package com.productmanagement.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

@Tag(name = "供应商编码序列号管理", description = "供应商编码序列号相关接口")
@RestController
@RequestMapping("/api/suppliers/code-sequences")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SupplierCodeSequenceController {
    
    private final DataSource dataSource;
    
    @Operation(summary = "获取下一个序列号", description = "根据规则ID和前缀获取下一个序列号，自动递增")
    @PostMapping("/next")
    public ResponseEntity<?> getNextSequence(@RequestBody Map<String, Object> request) {
        Long ruleId = Long.valueOf(request.get("ruleId").toString());
        String prefixKey = request.get("prefixKey").toString();
        Integer length = request.get("length") != null ? Integer.valueOf(request.get("length").toString()) : 4;
        String excludedDigits = request.get("excludedDigits") != null ? request.get("excludedDigits").toString() : "";
        
        try {
            String sequence = getNextSequenceNumber(ruleId, prefixKey, length, excludedDigits);
            Map<String, Object> result = new HashMap<>();
            result.put("sequence", sequence);
            result.put("ruleId", ruleId);
            result.put("prefixKey", prefixKey);
            return ResponseEntity.ok(Map.of("data", result, "success", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage(), "success", false));
        }
    }
    
    /**
     * 获取下一个序列号
     */
    private String getNextSequenceNumber(Long ruleId, String prefixKey, int length, String excludedDigits) throws SQLException {
        try (Connection conn = dataSource.getConnection()) {
            // 尝试获取当前序列号
            String selectSql = "SELECT current_sequence FROM supplier_code_sequences WHERE rule_id = ? AND prefix_key = ?";
            
            try (PreparedStatement selectStmt = conn.prepareStatement(selectSql)) {
                selectStmt.setLong(1, ruleId);
                selectStmt.setString(2, prefixKey);
                
                ResultSet rs = selectStmt.executeQuery();
                
                int currentSequence;
                if (rs.next()) {
                    currentSequence = rs.getInt("current_sequence");
                } else {
                    // 不存在记录，从 0 开始
                    currentSequence = 0;
                }
                rs.close();
                
                // 找下一个有效的序列号
                int nextSequence = findNextValidSequence(currentSequence, length, excludedDigits);
                
                // 更新或插入序列号
                String upsertSql = """
                    INSERT INTO supplier_code_sequences (rule_id, prefix_key, current_sequence, updated_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT (rule_id, prefix_key) 
                    DO UPDATE SET current_sequence = ?, updated_at = CURRENT_TIMESTAMP
                    """;
                
                try (PreparedStatement upsertStmt = conn.prepareStatement(upsertSql)) {
                    upsertStmt.setLong(1, ruleId);
                    upsertStmt.setString(2, prefixKey);
                    upsertStmt.setInt(3, nextSequence);
                    upsertStmt.setInt(4, nextSequence);
                    upsertStmt.executeUpdate();
                }
                
                // 格式化为指定位数
                return String.format("%0" + length + "d", nextSequence);
            }
        }
    }
    
    /**
     * 找下一个有效的序列号（排除指定数字）
     */
    private int findNextValidSequence(int currentSequence, int length, String excludedDigits) {
        int maxSequence = (int) Math.pow(10, length) - 1;
        
        // 解析排除的数字
        java.util.Set<String> excludeSet = new java.util.HashSet<>();
        if (excludedDigits != null && !excludedDigits.trim().isEmpty()) {
            for (String digit : excludedDigits.split(",")) {
                excludeSet.add(digit.trim());
            }
        }
        
        // 从当前序列号 + 1 开始找
        int nextSequence = currentSequence + 1;
        
        // 如果序列号已经是 0，从 1 开始
        if (nextSequence < 1) {
            nextSequence = 1;
        }
        
        // 检查序列号是否包含排除的数字
        while (nextSequence <= maxSequence) {
            String sequenceStr = String.format("%0" + length + "d", nextSequence);
            boolean hasExcludedDigit = false;
            
            for (String digit : excludeSet) {
                if (sequenceStr.contains(digit)) {
                    hasExcludedDigit = true;
                    break;
                }
            }
            
            if (!hasExcludedDigit) {
                return nextSequence;
            }
            
            nextSequence++;
        }
        
        // 如果所有序列号都被排除，抛出异常
        throw new RuntimeException("序列号已用尽，请调整位数或排除数字设置");
    }
    
    @Operation(summary = "重置序列号", description = "重置指定规则的序列号")
    @PostMapping("/reset")
    public ResponseEntity<?> resetSequence(@RequestBody Map<String, Object> request) {
        Long ruleId = Long.valueOf(request.get("ruleId").toString());
        String prefixKey = request.get("prefixKey") != null ? request.get("prefixKey").toString() : null;
        
        try (Connection conn = dataSource.getConnection()) {
            String sql;
            if (prefixKey != null) {
                sql = "UPDATE supplier_code_sequences SET current_sequence = 0, updated_at = CURRENT_TIMESTAMP WHERE rule_id = ? AND prefix_key = ?";
            } else {
                sql = "UPDATE supplier_code_sequences SET current_sequence = 0, updated_at = CURRENT_TIMESTAMP WHERE rule_id = ?";
            }
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setLong(1, ruleId);
                if (prefixKey != null) {
                    stmt.setString(2, prefixKey);
                }
                int rows = stmt.executeUpdate();
                return ResponseEntity.ok(Map.of("success", true, "message", "已重置 " + rows + " 条记录"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage(), "success", false));
        }
    }
}
