package com.productmanagement.repository;

import com.productmanagement.entity.ColorGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ColorGroupRepository extends JpaRepository<ColorGroup, Integer> {
    
    List<ColorGroup> findAllByOrderBySortOrderAsc();
    
    @Query("SELECT cg FROM ColorGroup cg LEFT JOIN FETCH cg.colorValues ORDER BY cg.sortOrder ASC")
    List<ColorGroup> findAllWithValuesOrderBySortOrder();
}
